import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { Customer } from '../customers/customer.model.js';
import { Wallet, WalletLedger, WalletWithdrawal } from './wallet.model.js';
import { ensureWalletBalances } from './wallet-balance.service.js';
import { createVpaPayout, requirePayoutConfig } from './razorpayx.service.js';

async function requestWithdrawal({ customerId, amountPaise, vpa, idempotencyKey }) {
  if (!Number.isSafeInteger(amountPaise) || amountPaise < 10000 || amountPaise > 1000000) {
    throw new AppError(422, 'INVALID_WITHDRAWAL_AMOUNT', 'Withdrawal amount must be between ₹100 and ₹10,000');
  }
  if (!/^[a-z0-9._-]{2,256}@[a-z0-9.-]{2,64}$/.test(vpa?.toLowerCase() || '')) {
    throw new AppError(422, 'INVALID_VPA', 'Enter a valid UPI ID');
  }
  await Promise.all([WalletWithdrawal.init(), WalletLedger.init()]);
  await ensureWalletBalances(customerId);
  const existing = await WalletWithdrawal.findOne({ customerId, idempotencyKey });
  if (existing) {
    if (existing.amountPaise !== amountPaise || existing.vpa !== vpa.toLowerCase()) throw new AppError(409, 'IDEMPOTENCY_CONFLICT', 'Use a new request key for different withdrawal details');
    return existing;
  }
  try {
    return await mongoose.connection.transaction(async (session) => {
      const withdrawal = await WalletWithdrawal.create([{
        withdrawalId: `WDR-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        customerId, amountPaise, vpa: vpa.toLowerCase(), idempotencyKey,
      }], { session });
      const wallet = await Wallet.findOneAndUpdate(
        { customerId, withdrawablePaise: { $gte: amountPaise }, balancePaise: { $gte: amountPaise } },
        { $inc: { withdrawablePaise: -amountPaise, balancePaise: -amountPaise } },
        { new: true, session },
      );
      if (!wallet) throw new AppError(409, 'INSUFFICIENT_WITHDRAWABLE_BALANCE', 'Only real-money wallet balance can be withdrawn');
      await WalletLedger.create([{ customerId, reference: `withdrawal:${withdrawal[0].id}:hold`, type: 'WITHDRAWAL_HOLD',
        amountPaise, balanceAfterPaise: wallet.balancePaise, withdrawableDeltaPaise: -amountPaise,
        description: `Withdrawal requested to ${vpa.toLowerCase()}` }], { session });
      return withdrawal[0];
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
    return WalletWithdrawal.findOne({ customerId, idempotencyKey });
  }
}

async function releaseWithdrawal(withdrawalId, status, reason, review = {}, allowedStatuses = ['PENDING', 'PROCESSING']) {
  return mongoose.connection.transaction(async (session) => {
    const withdrawal = await WalletWithdrawal.findOneAndUpdate(
      { _id: withdrawalId, status: { $in: allowedStatuses } },
      { $set: { status, failureReason: reason, ...review } }, { new: true, session },
    );
    if (!withdrawal) return WalletWithdrawal.findById(withdrawalId).session(session);
    const wallet = await Wallet.findOneAndUpdate({ customerId: withdrawal.customerId },
      { $inc: { balancePaise: withdrawal.amountPaise, withdrawablePaise: withdrawal.amountPaise } }, { new: true, session });
    await WalletLedger.create([{ customerId: withdrawal.customerId, reference: `withdrawal:${withdrawal.id}:release`,
      type: 'WITHDRAWAL_RELEASE', amountPaise: withdrawal.amountPaise, balanceAfterPaise: wallet.balancePaise,
      withdrawableDeltaPaise: withdrawal.amountPaise, description: `Withdrawal ${status.toLowerCase()}: money returned to wallet` }], { session });
    return withdrawal;
  });
}

async function settleWithdrawal(withdrawalId, payout) {
  if (payout.status === 'processed') {
    return await WalletWithdrawal.findOneAndUpdate(
      { _id: withdrawalId, status: 'PROCESSING' },
      { $set: { status: 'PAID', gatewayPayoutId: payout.id, utr: payout.utr, completedAt: new Date() }, $unset: { failureReason: 1 } },
      { new: true },
    ) || WalletWithdrawal.findById(withdrawalId);
  }
  if (['failed', 'reversed', 'cancelled', 'rejected'].includes(payout.status)) {
    return releaseWithdrawal(withdrawalId, payout.status === 'reversed' ? 'REVERSED' : 'FAILED',
      payout.status_details?.description || `RazorpayX payout ${payout.status}`);
  }
  return WalletWithdrawal.findByIdAndUpdate(withdrawalId,
    { $set: { status: 'PROCESSING', gatewayPayoutId: payout.id } }, { new: true });
}

async function reviewWithdrawal({ withdrawalId, reviewerId, decision, note }) {
  const withdrawal = await WalletWithdrawal.findById(withdrawalId).populate('customerId', 'name phone email');
  if (!withdrawal) throw new AppError(404, 'WITHDRAWAL_NOT_FOUND', 'Withdrawal request was not found');
  if (decision === 'REJECTED') {
    if (withdrawal.status !== 'PENDING') throw new AppError(409, 'WITHDRAWAL_ALREADY_REVIEWED', 'Only pending withdrawals can be rejected');
    const released = await releaseWithdrawal(withdrawal.id, 'REJECTED', note,
      { reviewedBy: reviewerId, reviewedAt: new Date(), reviewNote: note }, ['PENDING']);
    if (released?.status !== 'REJECTED') throw new AppError(409, 'WITHDRAWAL_ALREADY_REVIEWED', 'This withdrawal is already being processed');
    return released;
  }
  if (withdrawal.status === 'PAID') return withdrawal;
  if (!['PENDING', 'PROCESSING'].includes(withdrawal.status)) throw new AppError(409, 'WITHDRAWAL_NOT_PAYABLE', 'This withdrawal cannot be paid');
  requirePayoutConfig();
  const claimed = await WalletWithdrawal.findOneAndUpdate(
    { _id: withdrawal.id, status: { $in: ['PENDING', 'PROCESSING'] } },
    { $set: { status: 'PROCESSING', reviewedBy: reviewerId, reviewedAt: new Date(), reviewNote: note } }, { new: true },
  );
  const payout = await createVpaPayout(claimed, withdrawal.customerId);
  return settleWithdrawal(claimed.id, payout);
}

const listCustomerWithdrawals = (customerId) => WalletWithdrawal.find({ customerId }).sort({ createdAt: -1 }).limit(20).lean();
const listAdminWithdrawals = ({ status, limit }) => WalletWithdrawal.find(status ? { status } : {}).sort({ createdAt: -1 }).limit(limit)
  .populate('customerId', 'name phone email').populate('reviewedBy', 'name email').lean();

export { listAdminWithdrawals, listCustomerWithdrawals, releaseWithdrawal, requestWithdrawal, reviewWithdrawal, settleWithdrawal };

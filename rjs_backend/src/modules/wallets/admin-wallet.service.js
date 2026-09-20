import mongoose from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { Customer } from '../customers/customer.model.js';
import { Wallet, WalletAdjustment, WalletEvent, WalletLedger, WalletTopup } from './wallet.model.js';
import { ensureWalletBalances } from './wallet-balance.service.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function listAdminWallets({ page, limit, search }) {
  const customerMatch = search ? {
    $or: [
      { name: { $regex: escapeRegex(search), $options: 'i' } },
      { phone: { $regex: escapeRegex(search), $options: 'i' } },
      { email: { $regex: escapeRegex(search), $options: 'i' } },
    ],
  } : {};
  const [customers, total, totals, pendingTopups, archivedTopups] = await Promise.all([
    Customer.aggregate([
      { $match: customerMatch },
      { $lookup: { from: Wallet.collection.name, localField: '_id', foreignField: 'customerId', as: 'wallet' } },
      { $set: { wallet: { $first: '$wallet' }, balancePaise: { $ifNull: [{ $first: '$wallet.balancePaise' }, 0] } } },
      { $sort: { balancePaise: -1, createdAt: -1, _id: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      { $project: { name: 1, phone: 1, email: 1, status: 1, balancePaise: 1,
        withdrawablePaise: { $ifNull: ['$wallet.withdrawablePaise', 0] }, restrictedPaise: { $ifNull: ['$wallet.restrictedPaise', 0] },
        walletUpdatedAt: '$wallet.updatedAt', createdAt: 1 } },
    ]),
    Customer.countDocuments(customerMatch),
    Wallet.aggregate([{ $group: { _id: null, balancePaise: { $sum: '$balancePaise' }, fundedWallets: { $sum: { $cond: [{ $gt: ['$balancePaise', 0] }, 1, 0] } } } }]),
    WalletTopup.countDocuments({ status: 'PENDING', archivedAt: { $exists: false } }),
    WalletTopup.countDocuments({ status: 'PENDING', archivedAt: { $exists: true } }),
  ]);
  return {
    items: customers,
    summary: { customerWallets: total, fundedWallets: totals[0]?.fundedWallets ?? 0,
      balancePaise: totals[0]?.balancePaise ?? 0, pendingTopups, archivedTopups },
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  };
}

async function getAdminWalletDetails(customerId, limit) {
  if (!mongoose.isValidObjectId(customerId)) throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'Customer was not found');
  const customer = await Customer.findById(customerId).select('name phone email status createdAt').lean();
  if (!customer) throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'Customer was not found');
  await ensureWalletBalances(customerId);
  const [wallet, ledger, topups] = await Promise.all([
    Wallet.findOne({ customerId }).select('balancePaise withdrawablePaise restrictedPaise createdAt updatedAt').lean(),
    WalletLedger.find({ customerId }).sort({ createdAt: -1, _id: -1 }).limit(limit).lean(),
    WalletTopup.find({ customerId }).sort({ createdAt: -1, _id: -1 }).limit(limit).select('-retryKey').lean(),
  ]);
  return { customer, wallet: wallet ?? { balancePaise: 0 }, ledger, topups };
}

async function requestWalletAdjustment({ customerId, requestedBy, type, amountPaise, reason, idempotencyKey, ip, userAgent }) {
  if (!await Customer.exists({ _id: customerId })) throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'Customer was not found');
  await WalletAdjustment.init();
  const fields = { customerId: new mongoose.Types.ObjectId(customerId), requestedBy: new mongoose.Types.ObjectId(requestedBy),
    type, amountPaise, reason, idempotencyKey };
  let adjustment;
  try { adjustment = await WalletAdjustment.create({ ...fields, requestIp: ip, requestUserAgent: userAgent }); }
  catch (error) {
    if (error.code !== 11000) throw error;
    adjustment = await WalletAdjustment.findOne({ requestedBy, idempotencyKey });
    if (!adjustment || adjustment.customerId.toString() !== customerId || adjustment.type !== type ||
        adjustment.amountPaise !== amountPaise || adjustment.reason !== reason) {
      throw new AppError(409, 'IDEMPOTENCY_CONFLICT', 'Use a new request key for different adjustment details');
    }
  }
  return adjustment;
}

async function listWalletAdjustments({ status, limit, admin }) {
  const filter = { ...(status ? { status } : {}), ...(admin.accountType === 'EMPLOYEE' ? { requestedBy: admin._id } : {}) };
  return WalletAdjustment.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit)
    .populate('customerId', 'name phone email').populate('requestedBy', 'name email').populate('reviewedBy', 'name email').lean();
}

async function reviewWalletAdjustment({ adjustmentId, reviewerId, decision, note, ip, userAgent }) {
  await Promise.all([Wallet.init(), WalletLedger.init(), WalletAdjustment.init(), WalletEvent.init()]);
  const existing = await WalletAdjustment.findById(adjustmentId);
  if (!existing) throw new AppError(404, 'ADJUSTMENT_NOT_FOUND', 'Wallet adjustment request was not found');
  if (existing.status !== 'PENDING') {
    if (existing.status !== decision) throw new AppError(409, 'ADJUSTMENT_ALREADY_REVIEWED', `This request was already ${existing.status.toLowerCase()}`);
    return { adjustment: existing, changed: false };
  }
  await ensureWalletBalances(existing.customerId);
  return mongoose.connection.transaction(async (session) => {
    const adjustment = await WalletAdjustment.findOne({ _id: adjustmentId, status: 'PENDING' }).session(session);
    if (!adjustment) {
      const reviewed = await WalletAdjustment.findById(adjustmentId).session(session);
      if (reviewed.status !== decision) throw new AppError(409, 'ADJUSTMENT_ALREADY_REVIEWED', `This request was already ${reviewed.status.toLowerCase()}`);
      return { adjustment: reviewed, changed: false };
    }
    adjustment.reviewedBy = reviewerId;
    adjustment.reviewNote = note;
    adjustment.reviewedAt = new Date();
    adjustment.reviewIp = ip;
    adjustment.reviewUserAgent = userAgent;
    if (decision === 'REJECTED') {
      adjustment.status = 'REJECTED';
      await adjustment.save({ session });
      return { adjustment, changed: true };
    }
    const delta = adjustment.type === 'CREDIT' ? adjustment.amountPaise : -adjustment.amountPaise;
    const currentWallet = await Wallet.findOne({ customerId: adjustment.customerId }).session(session);
    const restrictedDebit = adjustment.type === 'DEBIT' ? Math.min(currentWallet.restrictedPaise, adjustment.amountPaise) : 0;
    const withdrawableDebit = adjustment.type === 'DEBIT' ? adjustment.amountPaise - restrictedDebit : 0;
    const wallet = await Wallet.findOneAndUpdate({ customerId: adjustment.customerId,
      ...(adjustment.type === 'DEBIT' ? { balancePaise: { $gte: adjustment.amountPaise },
        restrictedPaise: { $gte: restrictedDebit }, withdrawablePaise: { $gte: withdrawableDebit } } : {}) },
    { $inc: { balancePaise: delta,
      restrictedPaise: adjustment.type === 'CREDIT' ? adjustment.amountPaise : -restrictedDebit,
      withdrawablePaise: -withdrawableDebit } }, { new: true, session });
    if (!wallet) throw new AppError(409, 'INSUFFICIENT_WALLET_BALANCE', 'The wallet does not have enough balance for this debit');
    adjustment.status = 'APPROVED';
    adjustment.balanceAfterPaise = wallet.balancePaise;
    adjustment.balanceBeforePaise = wallet.balancePaise - delta;
    await adjustment.save({ session });
    await WalletLedger.create([{ customerId: adjustment.customerId, reference: `adjustment:${adjustment.id}`,
      type: adjustment.type === 'CREDIT' ? 'ADMIN_CREDIT' : 'ADMIN_DEBIT', amountPaise: adjustment.amountPaise,
      balanceAfterPaise: wallet.balancePaise, restrictedDeltaPaise: adjustment.type === 'CREDIT' ? adjustment.amountPaise : -restrictedDebit,
      withdrawableDeltaPaise: -withdrawableDebit, description: adjustment.reason }], { session });
    if (adjustment.type === 'CREDIT') await WalletEvent.create([{ customerId: adjustment.customerId,
      type: 'CREDIT_CELEBRATION', amountPaise: adjustment.amountPaise, title: 'Wallet credit received',
      sourceType: 'ADMIN_CREDIT', sourceId: adjustment._id }], { session });
    return { adjustment, changed: true };
  });
}

export { listAdminWallets, getAdminWalletDetails, requestWalletAdjustment, listWalletAdjustments, reviewWalletAdjustment };

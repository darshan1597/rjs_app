import { AppError } from "../../common/errors/app-error.js";
import { DriverPayout, Payment, Refund } from "./payment.model.js";
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { Booking } from '../bookings/booking.model.js';
import { Wallet, WalletEvent, WalletLedger } from '../wallets/wallet.model.js';
import { createRefund, fetchPaymentRefunds } from './razorpay.service.js';
import { ensureWalletBalances } from '../wallets/wallet-balance.service.js';
async function listPayments({ tab, page, limit, search, status, method }) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const filter = {};
    if (status) filter.status = status;
    if (method && tab === "transactions") filter.method = method;
    if (search) {
        const value = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.$or =
        tab === "transactions"
            ? [
                { transactionId: { $regex: value, $options: "i" } },
                { customerName: { $regex: value, $options: "i" } },
                { customerPhone: { $regex: value, $options: "i" } },
            ]
            : tab === "payouts"
            ? [{ payoutId: { $regex: value, $options: "i" } }]
            : [
                { refundId: { $regex: value, $options: "i" } },
                { customerName: { $regex: value, $options: "i" } },
                ];
    }
    const Model =
        tab === "transactions"
        ? Payment
        : tab === "payouts"
            ? DriverPayout
            : Refund;
    let query = Model.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    if (tab === "transactions")
        query = query.populate("bookingId", "bookingNumber serviceType");
    if (tab === "payouts")
        query = query.populate("driverId", "driverCode personal.fullName");
    const [
        items,
        total,
        collected,
        pendingPayments,
        pendingPayouts,
        pendingRefunds,
        failedPayments,
    ] = await Promise.all([
        query.lean(),
        Model.countDocuments(filter),
        Payment.aggregate([
        { $match: { status: { $in: ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"] }, paidAt: { $gte: start } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Payment.countDocuments({ status: "PENDING" }),
        DriverPayout.countDocuments({ status: { $in: ["PENDING", "FAILED"] } }),
        Refund.countDocuments({ status: "PENDING" }),
        Payment.countDocuments({ status: "FAILED" }),
    ]);
    return {
        items,
        summary: {
            collectedToday: collected[0]?.total || 0,
            pendingPayments,
            pendingPayouts,
            pendingRefunds,
            failedPayments,
        },
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
}
async function retryPayout(id) {
    const item = await DriverPayout.findOneAndUpdate(
        { _id: id, status: "FAILED" },
        { $set: { status: "PROCESSING", failureReason: "" } },
        { new: true },
    );
    if (!item)
        throw new AppError(
            409,
            "PAYOUT_NOT_RETRYABLE",
            "Only failed payouts can be retried",
        );
    return item;
}
async function createRefundRequest(paymentId, { amount, reason, requestKey }, adminId) {
  const amountPaise = Math.round(amount * 100);
  if (!Number.isSafeInteger(amountPaise) || amountPaise < 100 || Math.abs(amount * 100 - amountPaise) > 0.001) {
    throw new AppError(422, 'INVALID_REFUND_AMOUNT', 'Refund amount must be at least ₹1 with at most two decimal places');
  }
  const payment = await Payment.findById(paymentId).populate('bookingId', 'customerId bookingNumber paymentStatus');
  if (!payment || !['PAID', 'PARTIALLY_REFUNDED'].includes(payment.status)) throw new AppError(409, 'PAYMENT_NOT_REFUNDABLE', 'Only a paid or partially refunded payment can be refunded');
  await ensureWalletBalances(payment.bookingId.customerId);
  const reserved = await Refund.aggregate([{ $match: { paymentId: payment._id, status: { $in: ['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED'] } } },
    { $group: { _id: null, total: { $sum: '$eligibleAmount' }, withdrawable: { $sum: '$withdrawableAmountPaise' } } }]);
  const remainingPaise = Math.round((payment.amount - (reserved[0]?.total || 0)) * 100);
  if (amountPaise > remainingPaise) throw new AppError(409, 'REFUND_EXCEEDS_AVAILABLE', `Maximum refundable amount is ₹${(remainingPaise / 100).toFixed(2)}`);
  const paymentPaise = Math.round(payment.amount * 100);
  let originalWithdrawablePaise = paymentPaise;
  if (payment.transactionId?.startsWith('wallet_') && !payment.razorpayPaymentId) {
    originalWithdrawablePaise = payment.walletWithdrawablePaidPaise || 0;
    if (!payment.walletWithdrawablePaidPaise && !payment.walletRestrictedPaidPaise) {
      const ledger = await WalletLedger.findOne({ reference: `ride:${payment.bookingId._id}` }).lean();
      originalWithdrawablePaise = Math.max(0, -(ledger?.withdrawableDeltaPaise || 0));
      if (!originalWithdrawablePaise && !(ledger?.restrictedDeltaPaise)) originalWithdrawablePaise = paymentPaise;
      await Payment.updateOne({ _id: payment._id }, { $set: {
        walletWithdrawablePaidPaise: originalWithdrawablePaise,
        walletRestrictedPaidPaise: paymentPaise - originalWithdrawablePaise,
      } });
    }
  }
  const priorPaise = Math.round((reserved[0]?.total || 0) * 100);
  const priorWithdrawablePaise = reserved[0]?.withdrawable || 0;
  const cumulativeWithdrawablePaise = Math.round((priorPaise + amountPaise) * originalWithdrawablePaise / paymentPaise);
  const withdrawableAmountPaise = Math.max(0, Math.min(amountPaise, cumulativeWithdrawablePaise - priorWithdrawablePaise));
  const restrictedAmountPaise = amountPaise - withdrawableAmountPaise;
  const values = { refundId: `RFR-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    paymentId: payment._id, bookingId: payment.bookingId._id, customerId: payment.bookingId.customerId,
    customerName: payment.customerName, reason, originalAmount: payment.amount, eligibleAmount: amountPaise / 100,
    cancellationCharge: 0, channel: 'WALLET', withdrawableAmountPaise, restrictedAmountPaise,
    requestedBy: adminId, requestKey };
  try { return await Refund.create(values); } catch (error) {
    if (error.code !== 11000) throw error;
    const existing = await Refund.findOne({ requestedBy: adminId, requestKey });
    if (!existing || existing.paymentId.toString() !== paymentId || existing.eligibleAmount !== values.eligibleAmount || existing.reason !== reason) throw new AppError(409, 'IDEMPOTENCY_CONFLICT', 'Use a new request key for different refund details');
    return existing;
  }
}

async function reserveRefund(refundId, adminId, note) {
  return mongoose.connection.transaction(async (session) => {
    const refund = await Refund.findOne({ _id: refundId, status: { $in: ['PENDING', 'FAILED'] } }).session(session);
    if (!refund) return Refund.findById(refundId).populate('paymentId').session(session);
    const payment = await Payment.findOneAndUpdate({
      _id: refund.paymentId,
      status: { $in: ['PAID', 'PARTIALLY_REFUNDED'] },
      $expr: { $gte: [
        { $subtract: ['$amount', { $add: [
          { $ifNull: ['$refundedAmount', 0] },
          { $ifNull: ['$refundReservedAmount', 0] },
        ] }] },
        refund.eligibleAmount,
      ] },
    }, { $inc: { refundReservedAmount: refund.eligibleAmount } }, { new: true, session });
    if (!payment) throw new AppError(409, 'REFUND_EXCEEDS_AVAILABLE', 'The remaining refundable amount is no longer sufficient');
    refund.status = 'APPROVED';
    refund.reviewNote = note;
    refund.reviewedBy = adminId;
    refund.reviewedAt = new Date();
    refund.failureReason = undefined;
    await refund.save({ session });
    return refund.populate('paymentId');
  });
}

async function failRefund(refundId, gatewayRefundId, reason) {
  return mongoose.connection.transaction(async (session) => {
    const refund = await Refund.findOneAndUpdate(
      { _id: refundId, status: { $in: ['APPROVED', 'PROCESSING'] } },
      { $set: { status: 'FAILED', failureReason: reason, ...(gatewayRefundId ? { gatewayRefundId } : {}) } },
      { new: true, session },
    );
    if (!refund) return Refund.findById(refundId).session(session);
    await Payment.updateOne({ _id: refund.paymentId }, [{ $set: {
      refundReservedAmount: { $max: [0, { $subtract: [{ $ifNull: ['$refundReservedAmount', 0] }, refund.eligibleAmount] }] },
    } }], { session });
    return refund;
  });
}

async function completeRefund(refundId, gatewayRefund) {
  return mongoose.connection.transaction(async (session) => {
    const refund = await Refund.findOneAndUpdate({ _id: refundId, status: { $in: ['APPROVED', 'PROCESSING'] } },
      { $set: { status: 'COMPLETED', completedAt: new Date(), ...(gatewayRefund?.id ? { gatewayRefundId: gatewayRefund.id } : {}) },
        $unset: { failureReason: 1 } }, { new: true, session });
    if (!refund) return Refund.findById(refundId).session(session);
    if (refund.channel === 'WALLET') {
      const amountPaise = Math.round(refund.eligibleAmount * 100);
      const paymentForAllocation = await Payment.findById(refund.paymentId).session(session);
      const paymentPaise = Math.round(paymentForAllocation.amount * 100);
      const internalWalletPayment = paymentForAllocation.transactionId?.startsWith('wallet_') && !paymentForAllocation.razorpayPaymentId;
      const originalWithdrawablePaise = internalWalletPayment
        ? paymentForAllocation.walletWithdrawablePaidPaise
        : paymentPaise;
      const priorRows = await Refund.aggregate([
        { $match: { paymentId: refund.paymentId, status: 'COMPLETED', _id: { $ne: refund._id } } },
        { $group: { _id: null, totalPaise: { $sum: { $round: [{ $multiply: ['$eligibleAmount', 100] }, 0] } },
          withdrawablePaise: { $sum: '$withdrawableAmountPaise' } } },
      ]).session(session);
      const priorPaise = priorRows[0]?.totalPaise || 0;
      const priorWithdrawablePaise = priorRows[0]?.withdrawablePaise || 0;
      const targetWithdrawablePaise = Math.round((priorPaise + amountPaise) * originalWithdrawablePaise / paymentPaise);
      const withdrawableAmountPaise = Math.max(0, Math.min(amountPaise, targetWithdrawablePaise - priorWithdrawablePaise));
      const restrictedAmountPaise = amountPaise - withdrawableAmountPaise;
      refund.withdrawableAmountPaise = withdrawableAmountPaise;
      refund.restrictedAmountPaise = restrictedAmountPaise;
      await refund.save({ session });
      const wallet = await Wallet.findOneAndUpdate({ customerId: refund.customerId }, { $inc: {
        balancePaise: amountPaise, withdrawablePaise: withdrawableAmountPaise, restrictedPaise: restrictedAmountPaise,
      } }, { new: true, upsert: true, session });
      await WalletLedger.create([{ customerId: refund.customerId, reference: `refund:${refund.id}`, type: 'REFUND_CREDIT',
        amountPaise, balanceAfterPaise: wallet.balancePaise, withdrawableDeltaPaise: withdrawableAmountPaise,
        restrictedDeltaPaise: restrictedAmountPaise, description: `Refund ${refund.refundId}: ${refund.reason}` }], { session });
      await WalletEvent.create([{ customerId: refund.customerId, type: 'CREDIT_CELEBRATION', amountPaise,
        title: 'Refund credited to wallet', sourceType: 'REFUND', sourceId: refund._id }], { session });
    }
    const payment = await Payment.findByIdAndUpdate(refund.paymentId, [{ $set: {
      refundReservedAmount: { $max: [0, { $subtract: [{ $ifNull: ['$refundReservedAmount', 0] }, refund.eligibleAmount] }] },
      refundedAmount: { $add: [{ $ifNull: ['$refundedAmount', 0] }, refund.eligibleAmount] },
    } }], { new: true, session });
    const paymentStatus = payment.refundedAmount + 0.00001 >= payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    await Payment.updateOne({ _id: payment._id }, { $set: { status: paymentStatus } }, { session });
    if (paymentStatus === 'REFUNDED') await Booking.updateOne({ _id: payment.bookingId }, { $set: { paymentStatus: 'REFUNDED' } }, { session });
    return refund;
  });
}

async function initiateGatewayRefund(refund) {
  await Refund.updateOne(
    { _id: refund._id, status: { $in: ['APPROVED', 'PROCESSING'] } },
    { $set: { status: 'PROCESSING' }, $unset: { failureReason: 1 } },
  );
  const existing = await fetchPaymentRefunds(refund.paymentId.razorpayPaymentId);
  let gatewayRefund = existing.items?.find((item) => item.receipt === refund.refundId);
  gatewayRefund ||= await createRefund(refund.paymentId.razorpayPaymentId, { amount: Math.round(refund.eligibleAmount * 100),
    receipt: refund.refundId, notes: { rjsRefundId: refund.id, bookingId: refund.bookingId.toString() } });
  if (gatewayRefund.status === 'failed') return failRefund(refund.id, gatewayRefund.id, 'Razorpay could not process the refund');
  await Refund.updateOne({ _id: refund._id, status: { $ne: 'COMPLETED' } }, { $set: { gatewayRefundId: gatewayRefund.id,
    status: 'PROCESSING' }, $unset: { failureReason: 1 } });
  if (gatewayRefund.status === 'processed') return completeRefund(refund.id, gatewayRefund);
  return Refund.findById(refund.id);
}

async function reviewRefund(id, { decision, note }, adminId) {
  let item = await Refund.findById(id).populate('paymentId');
  if (!item) throw new AppError(404, 'REFUND_NOT_FOUND', 'Refund request was not found');
  if (decision === 'REJECTED') {
    if (item.status !== 'PENDING') throw new AppError(409, 'REFUND_ALREADY_REVIEWED', 'Only a pending refund can be rejected');
    return Refund.findByIdAndUpdate(id, { $set: { status: 'REJECTED', reviewNote: note, reviewedBy: adminId, reviewedAt: new Date() } }, { new: true });
  }
  if (item.status === 'COMPLETED') return item;
  if (!['PENDING', 'APPROVED', 'PROCESSING', 'FAILED'].includes(item.status)) throw new AppError(409, 'REFUND_ALREADY_REVIEWED', 'This refund cannot be approved');
  if (['PENDING', 'FAILED'].includes(item.status)) item = await reserveRefund(id, adminId, note);
  return completeRefund(item.id);
}
export { completeRefund, createRefundRequest, failRefund, listPayments, retryPayout, reviewRefund };

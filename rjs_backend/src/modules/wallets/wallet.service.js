import mongoose from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { Wallet, WalletTopup, WalletLedger } from './wallet.model.js';
import { Booking } from '../bookings/booking.model.js';
import { Payment } from '../payments/payment.model.js';
import { Driver } from '../drivers/driver.model.js';
import { ensureWalletBalances } from './wallet-balance.service.js';

export function walletQuote(amount) {
  const grossPaise = Math.round(amount * 100);
  if (!Number.isSafeInteger(grossPaise) || grossPaise <= 0) throw new AppError(409, 'INVALID_BILL', 'The final bill is invalid');
  const discountPaise = Math.round(grossPaise * 5 / 100);
  return { grossPaise, discountPaise, payablePaise: grossPaise - discountPaise };
}
export async function ensureWallet(customerId) {
  await Promise.all([Wallet.init(), WalletTopup.init(), WalletLedger.init()]);
  return ensureWalletBalances(customerId);
}
// The transaction is essential: never fall back to non-atomic financial writes.
export async function creditTopup(payment) {
  if (!payment?.order_id) return false;
  const topup = await WalletTopup.findOne({ orderId: payment.order_id });
  if (!topup) return false;
  if (payment.status !== 'captured' || payment.currency !== 'INR' || payment.amount !== topup.amountPaise) {
    throw new AppError(409, 'TOPUP_NOT_CAPTURED', 'The wallet payment is not captured or its amount does not match');
  }
  await ensureWallet(topup.customerId);
  await mongoose.connection.transaction(async (session) => {
    const claimed = await WalletTopup.findOneAndUpdate({ _id: topup._id, status: 'PENDING' },
      { $set: { status: 'CREDITED', paymentId: payment.id }, $unset: { archivedAt: 1, archiveReason: 1 } }, { new: true, session });
    if (!claimed) return;
    const wallet = await Wallet.findOneAndUpdate({ customerId: topup.customerId },
      { $inc: { balancePaise: topup.amountPaise, withdrawablePaise: topup.amountPaise } }, { new: true, session });
    await WalletLedger.create([{ customerId: topup.customerId, reference: `topup:${topup.id}`,
      type: 'TOPUP', amountPaise: topup.amountPaise, balanceAfterPaise: wallet.balancePaise,
      withdrawableDeltaPaise: topup.amountPaise,
      description: 'Money added through Razorpay' }], { session });
  });
  return true;
}
export async function payRideWithWallet(customerId, bookingId) {
  await ensureWallet(customerId);
  await Payment.init();
  return mongoose.connection.transaction(async (session) => {
    const booking = await Booking.findOne({ _id: bookingId, customerId }).session(session);
    if (booking?.paymentStatus === 'PAID' && booking.paymentChannel === 'WALLET') return booking;
    if (!booking || booking.status !== 'PAYMENT_PENDING' || booking.paymentStatus !== 'PENDING') {
      throw new AppError(409, 'PAYMENT_NOT_AVAILABLE', 'The final completed-ride bill is not ready for payment');
    }
    if (booking.paymentChannel === 'RAZORPAY' || booking.razorpayOrderId || booking.razorpayQrCodeId) {
      throw new AppError(409, 'PAYMENT_ALREADY_STARTED', 'Razorpay checkout or payment QR has already been started for this ride. Please complete that payment.');
    }
    const quote = walletQuote(booking.totalAmount);
    const currentWallet = await Wallet.findOne({ customerId, balancePaise: { $gte: quote.payablePaise } }).session(session);
    if (!currentWallet) throw new AppError(409, 'INSUFFICIENT_WALLET_BALANCE', 'Insufficient wallet balance. Add money or choose Razorpay.');
    const restrictedPaidPaise = Math.min(currentWallet.restrictedPaise, quote.payablePaise);
    const withdrawablePaidPaise = quote.payablePaise - restrictedPaidPaise;
    const wallet = await Wallet.findOneAndUpdate({ _id: currentWallet._id, balancePaise: { $gte: quote.payablePaise },
      restrictedPaise: { $gte: restrictedPaidPaise }, withdrawablePaise: { $gte: withdrawablePaidPaise } },
    { $inc: { balancePaise: -quote.payablePaise, restrictedPaise: -restrictedPaidPaise,
      withdrawablePaise: -withdrawablePaidPaise } }, { new: true, session });
    if (!wallet) throw new AppError(409, 'WALLET_BALANCE_CHANGED', 'Wallet balance changed. Please try again.');
    booking.paymentChannel = 'WALLET';
    booking.walletDiscountAmount = quote.discountPaise / 100;
    booking.walletPaidAmount = quote.payablePaise / 100;
    booking.paymentStatus = 'PAID';
    booking.paymentMethod = 'WALLET';
    booking.status = 'COMPLETED';
    booking.statusHistory.push({ status: 'COMPLETED', note: 'Paid with RJS wallet; 5% discount applied' });
    await booking.save({ session });
    await WalletLedger.create([{ customerId, reference: `ride:${booking.id}`, type: 'RIDE_PAYMENT',
      amountPaise: quote.payablePaise, discountPaise: quote.discountPaise, balanceAfterPaise: wallet.balancePaise,
      withdrawableDeltaPaise: -withdrawablePaidPaise, restrictedDeltaPaise: -restrictedPaidPaise,
      description: `Ride ${booking.bookingNumber}` }], { session });
    await Payment.create([{ bookingId: booking._id, transactionId: `wallet_${booking.id}`, method: 'WALLET',
      methodDisplay: 'RJS Wallet', amount: quote.payablePaise / 100, status: 'PAID', paidAt: new Date(),
      walletWithdrawablePaidPaise: withdrawablePaidPaise, walletRestrictedPaidPaise: restrictedPaidPaise,
      customerName: booking.customer.name, customerPhone: booking.customer.phone, bookingType: booking.serviceType }], { session });
    await Driver.updateOne({ _id: booking.currentDriverId, operationalStatus: 'ON_TRIP' },
      { $set: { operationalStatus: 'ONLINE' } }, { session });
    return booking;
  });
}

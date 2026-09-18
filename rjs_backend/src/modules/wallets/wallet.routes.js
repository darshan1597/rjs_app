import express from 'express';
import { z } from 'zod';
import { authenticateCustomer } from '../customers/customer-auth.middleware.js';
import { validate } from '../../common/middleware/validate.js';
import { AppError } from '../../common/errors/app-error.js';
import { env } from '../../config/env.js';
import { createSingleFlight } from '../../common/single-flight.js';
import { createWalletOrder, fetchPayment, verifyCheckoutSignature } from '../payments/razorpay.service.js';
import { WalletTopup, WalletLedger } from './wallet.model.js';
import { ensureWallet, creditTopup, payRideWithWallet, walletQuote } from './wallet.service.js';
import { Booking } from '../bookings/booking.model.js';
import { reconcileTopup, sweepWalletTopups } from './wallet-cleanup.service.js';
const router = express.Router();
const flight = createSingleFlight();
const empty = z.object({});
const id = z.string().regex(/^[a-f\d]{24}$/i);
const schema = (body, params = empty) => z.object({ body, params, query: empty });
router.use(authenticateCustomer);
router.get('/', async (req, res, next) => {
  try {
    await sweepWalletTopups({ customerId: req.customer.id, limit: 3 }).catch(() => {});
    const wallet = await ensureWallet(req.customer.id);
    const transactions = await WalletLedger.find({ customerId: req.customer.id }).sort({ createdAt: -1, _id: -1 }).limit(50).lean();
    const pendingTopups = await WalletTopup.find({ customerId: req.customer.id, status: 'PENDING', archivedAt: { $exists: false }, orderId: { $exists: true } }).sort({ createdAt: -1 }).limit(5).lean();
    res.json({ success: true, data: { balancePaise: wallet.balancePaise, discountPercent: 5, transactions, pendingTopups } });
  } catch (error) { next(error); }
});
router.post('/topups', validate(schema(z.object({ amountPaise: z.number().int().min(10000).max(1000000), retryKey: z.string().regex(/^[a-zA-Z0-9_-]{16,100}$/) }))), async (req, res, next) => {
  try {
    const { amountPaise, retryKey } = req.validated.body;
    await ensureWallet(req.customer.id);
    let topup;
    try {
      topup = await WalletTopup.findOneAndUpdate({ customerId: req.customer.id, retryKey },
        { $setOnInsert: { amountPaise } }, { new: true, upsert: true });
    } catch (error) {
      if (error.code !== 11000) throw error;
      topup = await WalletTopup.findOne({ customerId: req.customer.id, retryKey });
    }
    if (topup.amountPaise !== amountPaise) throw new AppError(409, 'IDEMPOTENCY_CONFLICT', 'Use a new retry key for a different top-up amount');
    if (topup.status !== 'CREDITED') {
      await WalletTopup.updateOne({ _id: topup._id, status: 'PENDING' },
        { $set: { lastOpenedAt: new Date() }, $unset: { archivedAt: 1, archiveReason: 1 } });
    }
    if (!topup.orderId) {
      await flight(topup.id, async () => {
        const fresh = await WalletTopup.findById(topup._id);
        if (fresh.orderId) return;
        const order = await createWalletOrder(fresh);
        await WalletTopup.updateOne({ _id: fresh._id, orderId: { $exists: false } }, { $set: { orderId: order.id } });
      });
      topup = await WalletTopup.findById(topup._id);
    }
    res.json({ success: true, data: { topupId: topup.id, status: topup.status, keyId: env.RAZORPAY_KEY_ID, orderId: topup.orderId,
      amountPaise: topup.amountPaise, currency: 'INR', name: 'RJS Wallet', customer: { name: req.customer.name, phone: req.customer.phone } } });
  } catch (error) { next(error); }
});
router.post('/topups/:topupId/verify', validate(schema(z.object({ paymentId: z.string().min(5).max(100), signature: z.string().min(20).max(200) }), z.object({ topupId: id }))), async (req, res, next) => {
  try {
    const topup = await WalletTopup.findOne({ _id: req.validated.params.topupId, customerId: req.customer.id });
    if (!topup?.orderId) throw new AppError(404, 'TOPUP_NOT_FOUND', 'Top-up was not found');
    const { paymentId, signature } = req.validated.body;
    if (!verifyCheckoutSignature({ orderId: topup.orderId, paymentId, signature })) throw new AppError(400, 'INVALID_PAYMENT_SIGNATURE', 'Payment verification failed');
    const payment = await fetchPayment(paymentId);
    if (payment.order_id !== topup.orderId) throw new AppError(409, 'TOPUP_MISMATCH', 'Payment does not belong to this top-up');
    await creditTopup(payment);
    res.json({ success: true, data: { credited: true } });
  } catch (error) { next(error); }
});
router.post('/topups/:topupId/reconcile', validate(schema(empty, z.object({ topupId: id }))), async (req, res, next) => {
  try {
    const topup = await WalletTopup.findOne({ _id: req.validated.params.topupId, customerId: req.customer.id });
    if (!topup?.orderId) throw new AppError(404, 'TOPUP_NOT_FOUND', 'Top-up was not found');
    res.json({ success: true, data: await reconcileTopup(topup) });
  } catch (error) { next(error); }
});
router.get('/rides/:bookingId/quote', validate(schema(z.unknown().optional(), z.object({ bookingId: id }))), async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.validated.params.bookingId, customerId: req.customer.id, status: 'PAYMENT_PENDING', paymentStatus: 'PENDING' });
    if (!booking) throw new AppError(409, 'PAYMENT_NOT_AVAILABLE', 'The final ride bill is not ready');
    const wallet = await ensureWallet(req.customer.id);
    const available = !booking.paymentChannel && !booking.razorpayOrderId && !booking.razorpayQrCodeId;
    res.json({ success: true, data: { ...walletQuote(booking.totalAmount), balancePaise: wallet.balancePaise, available } });
  } catch (error) { next(error); }
});
router.post('/rides/:bookingId/pay', validate(schema(empty, z.object({ bookingId: id }))), async (req, res, next) => {
  try {
    const booking = await payRideWithWallet(req.customer.id, req.validated.params.bookingId);
    res.json({ success: true, data: { bookingId: booking.id, amountPaid: booking.walletPaidAmount, discount: booking.walletDiscountAmount } });
  } catch (error) { next(error); }
});
export { router as customerWalletRouter };

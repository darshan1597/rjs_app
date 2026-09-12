import express from 'express';

import { Booking } from '../bookings/booking.model.js';
import { Payment } from './payment.model.js';
import { Driver } from '../drivers/driver.model.js';
import { closeQrCode, verifyWebhookSignature } from './razorpay.service.js';

const router = express.Router();

async function settlePayment({ payment, eventId }) {
  const notes = payment.notes || {};
  const booking = await Booking.findOne({
    _id: notes.bookingId,
    status: 'PAYMENT_PENDING',
    paymentStatus: 'PENDING',
  });
  if (!booking || Math.round(booking.totalAmount * 100) !== payment.amount || payment.currency !== 'INR') return;

  await Payment.findOneAndUpdate(
    { bookingId: booking._id },
    {
      $set: {
        transactionId: payment.id,
        razorpayPaymentId: payment.id,
        razorpayOrderId: payment.order_id,
        gatewayReference: eventId,
        method: 'UPI',
        methodDisplay: payment.method || 'Razorpay',
        amount: booking.totalAmount,
        status: 'PAID',
        paidAt: new Date(),
        customerName: booking.customer.name,
        customerPhone: booking.customer.phone,
        bookingType: booking.serviceType,
      },
    },
    { upsert: true, new: true, runValidators: true },
  );
  booking.status = 'COMPLETED';
  booking.paymentStatus = 'PAID';
  booking.paymentMethod = 'UPI';
  booking.statusHistory.push({ status: 'COMPLETED', note: 'Razorpay captured the final trip payment' });
  await booking.save();
  if (booking.razorpayQrCodeId && payment.qr_code_id !== booking.razorpayQrCodeId) {
    await closeQrCode(booking.razorpayQrCodeId).catch(() => {});
  }
  await Driver.updateOne({ _id: booking.currentDriverId }, { $set: { operationalStatus: 'ONLINE' } });
}

router.post('/', express.raw({ type: 'application/json', limit: '1mb' }), async (req, res, next) => {
  try {
    const signature = req.get('X-Razorpay-Signature') || '';
    if (!verifyWebhookSignature(req.body, signature)) return res.status(401).json({ success: false });
    const payload = JSON.parse(req.body.toString('utf8'));
    if (['payment.captured', 'order.paid'].includes(payload.event)) {
      const payment = payload.payload?.payment?.entity;
      if (payment?.status === 'captured') await settlePayment({ payment, eventId: req.get('x-razorpay-event-id') });
    }
    return res.json({ success: true });
  } catch (error) { return next(error); }
});

export { router as razorpayWebhookRouter };

import express from 'express';

import { Booking } from '../bookings/booking.model.js';
import { Payment, RazorpayWebhookEvent, Refund } from './payment.model.js';
import { Driver } from '../drivers/driver.model.js';
import { closeQrCode, verifyWebhookSignature } from './razorpay.service.js';
import { creditTopup } from '../wallets/wallet.service.js';
import { completeRefund, failRefund } from './payment.service.js';

const router = express.Router();
const paymentMethod = (method) => ({
  upi: 'UPI', card: 'CARD', netbanking: 'NET_BANKING', wallet: 'WALLET',
}[method] || 'CARD');
const bookingReferences = (payment) => {
  const references = [];
  if (payment.notes?.bookingId) references.push({ _id: payment.notes.bookingId });
  if (payment.order_id) references.push({ razorpayOrderId: payment.order_id });
  if (payment.qr_code_id) references.push({ razorpayQrCodeId: payment.qr_code_id });
  return references;
};

async function settlePayment({ payment, eventId }) {
  const references = bookingReferences(payment);
  if (references.length === 0) return;
  const booking = await Booking.findOne({
    $or: references,
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
        method: paymentMethod(payment.method),
        methodDisplay: payment.method || 'Razorpay',
        amount: booking.totalAmount,
        status: 'PAID',
        paidAt: new Date(),
        customerName: booking.customer.name,
        customerPhone: booking.customer.phone,
        bookingType: booking.serviceType,
      },
      $unset: { failedAt: 1, failureCode: 1, failureReason: 1, failureDescription: 1 },
    },
    { upsert: true, new: true, runValidators: true },
  );
  booking.status = 'COMPLETED';
  booking.paymentStatus = 'PAID';
  booking.paymentMethod = paymentMethod(payment.method);
  booking.statusHistory.push({ status: 'COMPLETED', note: 'Razorpay captured the final trip payment' });
  await booking.save();
  if (booking.razorpayQrCodeId && payment.qr_code_id !== booking.razorpayQrCodeId) {
    await closeQrCode(booking.razorpayQrCodeId).catch(() => {});
  }
  await Driver.updateOne({ _id: booking.currentDriverId }, { $set: { operationalStatus: 'ONLINE' } });
}

async function recordFailedPayment({ payment, eventId }) {
  const references = bookingReferences(payment);
  if (references.length === 0) return;
  const booking = await Booking.findOne({
    $or: references,
    status: 'PAYMENT_PENDING',
    paymentStatus: 'PENDING',
  });
  if (!booking) return;
  await Payment.findOneAndUpdate(
    { bookingId: booking._id },
    {
      $set: {
        transactionId: payment.id,
        razorpayPaymentId: payment.id,
        razorpayOrderId: payment.order_id,
        gatewayReference: eventId,
        method: paymentMethod(payment.method),
        methodDisplay: `Razorpay ${payment.method || 'payment'}`,
        amount: booking.totalAmount,
        status: 'FAILED',
        failedAt: new Date(),
        failureCode: payment.error_code,
        failureReason: payment.error_reason,
        failureDescription: payment.error_description,
        customerName: booking.customer.name,
        customerPhone: booking.customer.phone,
        bookingType: booking.serviceType,
      },
      $unset: { paidAt: 1 },
    },
    { upsert: true, new: true, runValidators: true },
  );
}

async function settleRefund(entity) {
  const internalId = entity.notes?.rjsRefundId;
  const refund = await Refund.findOne({ $or: [
    { gatewayRefundId: entity.id },
    ...(/^[a-f\d]{24}$/i.test(internalId || '') ? [{ _id: internalId }] : []),
  ] });
  if (!refund || Math.round(refund.eligibleAmount * 100) !== entity.amount) return false;
  if (entity.status === 'processed') await completeRefund(refund.id, entity);
  else if (entity.status === 'failed') await failRefund(refund.id, entity.id, 'Razorpay reported that the refund failed');
  else return false;
  return true;
}

router.post('/', express.raw({ type: 'application/json', limit: '1mb' }), async (req, res, next) => {
  let eventRecord;
  try {
    const signature = req.get('X-Razorpay-Signature') || '';
    if (!verifyWebhookSignature(req.body, signature)) return res.status(401).json({ success: false });
    const payload = JSON.parse(req.body.toString('utf8'));
    const eventId = req.get('x-razorpay-event-id');
    if (!eventId) return res.status(400).json({ success: false, error: 'Missing event id' });
    try {
      eventRecord = await RazorpayWebhookEvent.create({
        eventId,
        eventType: payload.event,
      });
    } catch (error) {
      if (error?.code === 11000) return res.json({ success: true, duplicate: true });
      throw error;
    }
    if (['payment.captured', 'order.paid', 'qr_code.credited'].includes(payload.event)) {
      const entity = payload.payload?.payment?.entity;
      const qrId = payload.payload?.qr_code?.entity?.id;
      const payment = entity && { ...entity, ...(payload.event === 'qr_code.credited' && qrId ? { qr_code_id: qrId } : {}) };
      if (payment?.status === 'captured') {
        if (!await creditTopup(payment)) await settlePayment({ payment, eventId });
        eventRecord.paymentId = payment.id;
        eventRecord.status = 'PROCESSED';
      } else {
        eventRecord.status = 'IGNORED';
      }
    } else if (payload.event === 'payment.failed') {
      const payment = payload.payload?.payment?.entity;
      if (payment) {
        await recordFailedPayment({ payment, eventId });
        eventRecord.paymentId = payment.id;
        eventRecord.status = 'PROCESSED';
      } else {
        eventRecord.status = 'IGNORED';
      }
    } else if (['refund.processed', 'refund.failed'].includes(payload.event)) {
      const refund = payload.payload?.refund?.entity;
      if (refund && await settleRefund(refund)) {
        eventRecord.paymentId = refund.payment_id;
        eventRecord.status = 'PROCESSED';
      } else eventRecord.status = 'IGNORED';
    } else {
      eventRecord.status = 'IGNORED';
    }
    eventRecord.processedAt = new Date();
    await eventRecord.save();
    return res.json({ success: true });
  } catch (error) {
    if (eventRecord?._id) await RazorpayWebhookEvent.deleteOne({ _id: eventRecord._id }).catch(() => {});
    return next(error);
  }
});

export { router as razorpayWebhookRouter };

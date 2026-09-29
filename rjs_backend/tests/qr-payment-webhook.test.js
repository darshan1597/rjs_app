import express from 'express';
import request from 'supertest';
import { vi } from 'vitest';
vi.mock('../src/modules/customers/customer-push.service.js', () => ({ sendCustomerBookingPush: vi.fn().mockResolvedValue({ sent: 0 }) }));
vi.mock('../src/modules/wallets/wallet.service.js', () => ({ creditTopup: vi.fn().mockResolvedValue(false) }));

vi.mock('../src/modules/bookings/booking.model.js', () => ({ Booking: { findOne: vi.fn() } }));
vi.mock('../src/modules/payments/payment.model.js', () => ({ Payment: { findOneAndUpdate: vi.fn() }, Refund: { findOne: vi.fn(), updateOne: vi.fn() }, RazorpayWebhookEvent: { create: vi.fn(), deleteOne: vi.fn() } }));
vi.mock('../src/modules/payments/payment.service.js', () => ({ completeRefund: vi.fn(), failRefund: vi.fn() }));
vi.mock('../src/modules/drivers/driver.model.js', () => ({ Driver: { updateOne: vi.fn() } }));
vi.mock('../src/modules/payments/razorpay.service.js', () => ({ closeQrCode: vi.fn(), verifyWebhookSignature: vi.fn() }));

import { Booking } from '../src/modules/bookings/booking.model.js';
import { Payment, RazorpayWebhookEvent, Refund } from '../src/modules/payments/payment.model.js';
import { completeRefund, failRefund } from '../src/modules/payments/payment.service.js';
import { Driver } from '../src/modules/drivers/driver.model.js';
import { verifyWebhookSignature } from '../src/modules/payments/razorpay.service.js';
import { razorpayWebhookRouter } from '../src/modules/payments/razorpay-webhook.routes.js';
import { creditTopup } from '../src/modules/wallets/wallet.service.js';

const app = express();
app.use('/webhook', razorpayWebhookRouter);
const payload = (amount = 12500, status = 'captured') => ({
  event: 'qr_code.credited',
  payload: {
    payment: { entity: { id: 'pay_test', status, amount, currency: 'INR', method: 'upi', notes: {} } },
    qr_code: { entity: { id: 'qr_test' } },
  },
});
let booking;
beforeEach(() => {
  vi.resetAllMocks();
  creditTopup.mockResolvedValue(false);
  verifyWebhookSignature.mockReturnValue(true);
  RazorpayWebhookEvent.create.mockResolvedValue({ _id: 'event', save: vi.fn() });
  booking = { _id: 'booking', totalAmount: 125, razorpayQrCodeId: 'qr_test', currentDriverId: 'driver', customer: { name: 'Test', phone: '6666666666' }, statusHistory: [], save: vi.fn() };
  Booking.findOne.mockResolvedValue(booking);
});
const send = (body) => request(app).post('/webhook').set('x-razorpay-event-id', 'evt_test').send(body);

it('credits wallet top-ups without settling a ride', async () => {
  creditTopup.mockResolvedValue(true);
  const body = payload();
  body.event = 'payment.captured';
  body.payload.payment.entity.order_id = 'order_wallet';
  expect((await send(body)).status).toBe(200);
  expect(creditTopup).toHaveBeenCalledWith(expect.objectContaining({ order_id: 'order_wallet' }));
  expect(Booking.findOne).not.toHaveBeenCalled();
  expect(Payment.findOneAndUpdate).not.toHaveBeenCalled();
});

it('settles a captured QR payment using the QR id even without notes or an order', async () => {
  expect((await send(payload())).status).toBe(200);
  expect(Booking.findOne).toHaveBeenCalledWith(expect.objectContaining({ $or: [{ razorpayQrCodeId: 'qr_test' }], status: 'PAYMENT_PENDING', paymentStatus: 'PENDING' }));
  expect(Payment.findOneAndUpdate).toHaveBeenCalled();
  expect(booking.status).toBe('COMPLETED');
  expect(booking.paymentStatus).toBe('PAID');
  expect(Driver.updateOne).toHaveBeenCalledWith({ _id: 'driver' }, { $set: { operationalStatus: 'ONLINE' } });
});
it('does not settle the wrong amount', async () => {
  await send(payload(1));
  expect(Payment.findOneAndUpdate).not.toHaveBeenCalled();
  expect(booking.save).not.toHaveBeenCalled();
});
it('does not settle an uncaptured QR payment', async () => {
  await send(payload(12500, 'authorized'));
  expect(Booking.findOne).not.toHaveBeenCalled();
});
it('rejects an invalid signature', async () => {
  verifyWebhookSignature.mockReturnValue(false);
  expect((await send(payload())).status).toBe(401);
  expect(Booking.findOne).not.toHaveBeenCalled();
});
it('ignores duplicate delivery', async () => {
  RazorpayWebhookEvent.create.mockRejectedValue({ code: 11000 });
  expect((await send(payload())).body.duplicate).toBe(true);
  expect(Booking.findOne).not.toHaveBeenCalled();
});
it('completes the matching refund from a signed Razorpay webhook', async () => {
  Refund.findOne.mockResolvedValue({ id: 'refund-record', eligibleAmount: 50 });
  const body = { event: 'refund.processed', payload: { refund: { entity: {
    id: 'rfnd_gateway', payment_id: 'pay_test', amount: 5000, status: 'processed', notes: { rjsRefundId: 'a'.repeat(24) },
  } } } };
  expect((await send(body)).status).toBe(200);
  expect(completeRefund).toHaveBeenCalledWith('refund-record', expect.objectContaining({ id: 'rfnd_gateway' }));
});
it('releases a matching failed Razorpay refund for safe retry', async () => {
  Refund.findOne.mockResolvedValue({ id: 'refund-record', eligibleAmount: 50 });
  const body = { event: 'refund.failed', payload: { refund: { entity: {
    id: 'rfnd_gateway', payment_id: 'pay_test', amount: 5000, status: 'failed', notes: { rjsRefundId: 'a'.repeat(24) },
  } } } };
  expect((await send(body)).status).toBe(200);
  expect(failRefund).toHaveBeenCalledWith('refund-record', 'rfnd_gateway', expect.stringContaining('failed'));
});

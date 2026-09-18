import crypto from 'node:crypto';

import { AppError } from '../../common/errors/app-error.js';
import { env } from '../../config/env.js';

const endpoint = 'https://api.razorpay.com/v1';

function requireConfig() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError(503, 'PAYMENT_GATEWAY_NOT_CONFIGURED', 'Razorpay is not configured yet');
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  requireConfig();
  const response = await fetch(`${endpoint}${path}`, {
    method,
    ...(signal ? { signal } : {}),
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new AppError(502, 'RAZORPAY_REQUEST_FAILED', result.error?.description || 'Razorpay could not process the request');
  }
  return result;
}

const amountInPaise = (amount) => Math.round(Number(amount) * 100);

function createOrder(booking) {
  return request('/orders', {
    method: 'POST',
    body: {
      amount: amountInPaise(booking.totalAmount),
      currency: 'INR',
      receipt: booking.bookingNumber,
      notes: { bookingId: booking.id, bookingNumber: booking.bookingNumber },
    },
  });
}

function createQrCode(booking) {
  return request('/payments/qr_codes', {
    method: 'POST',
    body: {
      type: 'upi_qr',
      name: `RJS ${booking.bookingNumber}`,
      usage: 'single_use',
      fixed_amount: true,
      payment_amount: amountInPaise(booking.totalAmount),
      description: `Payment for ${booking.bookingNumber}`,
      close_by: Math.floor(Date.now() / 1000) + 2 * 60 * 60,
      notes: { bookingId: booking.id, bookingNumber: booking.bookingNumber },
    },
  });
}

function createWalletOrder(topup) {
  return request('/orders', { method: 'POST', body: {
    amount: topup.amountPaise, currency: 'INR', receipt: `WLT-${topup.id}`,
    notes: { walletTopupId: topup.id },
  } });
}
function fetchOrderPayments(orderId) {
  return request(`/orders/${encodeURIComponent(orderId)}/payments`, { signal: AbortSignal.timeout(12000) });
}

function fetchPayment(paymentId) {
  return request(`/payments/${encodeURIComponent(paymentId)}`);
}

function closeQrCode(qrCodeId) {
  return request(`/payments/qr_codes/${encodeURIComponent(qrCodeId)}/close`, {
    method: 'POST',
  });
}

function verifyCheckoutSignature({ orderId, paymentId, signature }) {
  requireConfig();
  const expected = crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected.length === signature.length
    && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

function verifyWebhookSignature(rawBody, signature) {
  if (!env.RAZORPAY_WEBHOOK_SECRET || !signature) return false;
  const expected = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return expected.length === signature.length
    && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export { closeQrCode, createOrder, createQrCode, createWalletOrder, fetchOrderPayments, fetchPayment, verifyCheckoutSignature, verifyWebhookSignature };

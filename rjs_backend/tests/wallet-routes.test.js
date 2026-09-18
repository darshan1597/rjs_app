import express from 'express';
import request from 'supertest';
import { vi } from 'vitest';
vi.mock('../src/config/env.js', () => ({ env: { RAZORPAY_KEY_ID: 'test-key' } }));
vi.mock('../src/modules/customers/customer-auth.middleware.js', () => ({ authenticateCustomer: (req, res, next) => { req.customer = { id: 'customer' }; next(); } }));
vi.mock('../src/modules/wallets/wallet.model.js', () => ({ WalletTopup: { findOne: vi.fn(), updateOne: vi.fn() }, WalletLedger: {} }));
vi.mock('../src/modules/wallets/wallet.service.js', () => ({ ensureWallet: vi.fn(), creditTopup: vi.fn(), payRideWithWallet: vi.fn(), walletQuote: vi.fn() }));
vi.mock('../src/modules/payments/razorpay.service.js', () => ({ createWalletOrder: vi.fn(), fetchPayment: vi.fn(), fetchOrderPayments: vi.fn(), verifyCheckoutSignature: vi.fn() }));
import { WalletTopup } from '../src/modules/wallets/wallet.model.js';
import { creditTopup } from '../src/modules/wallets/wallet.service.js';
import { fetchPayment, fetchOrderPayments, verifyCheckoutSignature } from '../src/modules/payments/razorpay.service.js';
import { customerWalletRouter } from '../src/modules/wallets/wallet.routes.js';
import { errorHandler } from '../src/common/middleware/error-handler.js';
const app = express();
app.use(express.json());
app.use('/wallet', customerWalletRouter);
app.use(errorHandler);
const id = 'a'.repeat(24);
const verification = { paymentId: 'pay_test', signature: 's'.repeat(64) };
beforeEach(() => {
  vi.resetAllMocks();
  WalletTopup.updateOne.mockResolvedValue({ modifiedCount: 1 });
  WalletTopup.findOne.mockResolvedValue({ _id: id, orderId: 'order_wallet', status: 'PENDING', createdAt: new Date() });
  verifyCheckoutSignature.mockReturnValue(true);
  fetchPayment.mockResolvedValue({ order_id: 'order_wallet' });
  creditTopup.mockResolvedValue(true);
});
it('rejects access to another account’s top-up', async () => {
  WalletTopup.findOne.mockResolvedValue(null);
  expect((await request(app).post(`/wallet/topups/${id}/verify`).send(verification)).status).toBe(404);
  expect(WalletTopup.findOne).toHaveBeenCalledWith({ _id: id, customerId: 'customer' });
  expect(creditTopup).not.toHaveBeenCalled();
});
it('rejects forged checkout success signatures', async () => {
  verifyCheckoutSignature.mockReturnValue(false);
  expect((await request(app).post(`/wallet/topups/${id}/verify`).send(verification)).status).toBe(400);
  expect(fetchPayment).not.toHaveBeenCalled();
  expect(creditTopup).not.toHaveBeenCalled();
});
it('does not credit a payment belonging to a different order', async () => {
  fetchPayment.mockResolvedValue({ order_id: 'order_other' });
  expect((await request(app).post(`/wallet/topups/${id}/verify`).send(verification)).status).toBe(409);
  expect(creditTopup).not.toHaveBeenCalled();
});
it('uses the stored order ID rather than trusting a client-supplied order', async () => {
  expect((await request(app).post(`/wallet/topups/${id}/verify`).send(verification)).status).toBe(200);
  expect(verifyCheckoutSignature).toHaveBeenCalledWith({ orderId: 'order_wallet', paymentId: verification.paymentId, signature: verification.signature });
  expect(creditTopup).toHaveBeenCalledWith({ order_id: 'order_wallet' });
});
it('recovers a captured payment after the app lost the checkout response', async () => {
  fetchOrderPayments.mockResolvedValue({ items: [{ status: 'captured', order_id: 'order_wallet' }] });
  const response = await request(app).post(`/wallet/topups/${id}/reconcile`).send({});
  expect(response.body.data.credited).toBe(true);
  expect(fetchOrderPayments).toHaveBeenCalledWith('order_wallet');
});
it('does not credit authorized-only payments during reconciliation', async () => {
  fetchOrderPayments.mockResolvedValue({ items: [{ status: 'authorized', order_id: 'order_wallet' }] });
  const response = await request(app).post(`/wallet/topups/${id}/reconcile`).send({});
  expect(response.body.data.credited).toBe(false);
  expect(creditTopup).not.toHaveBeenCalled();
});

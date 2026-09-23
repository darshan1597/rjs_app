import express from 'express';
import request from 'supertest';
import { vi } from 'vitest';
vi.mock('../src/config/env.js', () => ({ env: { RAZORPAY_KEY_ID: 'test-key' } }));
vi.mock('../src/modules/customers/customer-auth.middleware.js', () => ({ authenticateCustomer: (req, res, next) => { req.customer = { id: 'customer' }; next(); } }));
vi.mock('../src/modules/wallets/wallet.model.js', () => ({
  WalletTopup: { find: vi.fn(), findOne: vi.fn(), updateOne: vi.fn() },
  WalletLedger: { find: vi.fn() },
  WalletEvent: { findOne: vi.fn(), findOneAndUpdate: vi.fn() },
  WalletWithdrawal: { aggregate: vi.fn() },
}));
vi.mock('../src/modules/wallets/wallet.service.js', () => ({ ensureWallet: vi.fn(), creditTopup: vi.fn(), payRideWithWallet: vi.fn(), walletQuote: vi.fn() }));
vi.mock('../src/modules/payments/razorpay.service.js', () => ({ createWalletOrder: vi.fn(), fetchPayment: vi.fn(), fetchOrderPayments: vi.fn(), verifyCheckoutSignature: vi.fn() }));
vi.mock('../src/modules/wallets/wallet-withdrawal.service.js', () => ({
  listCustomerWithdrawals: vi.fn().mockResolvedValue([]), requestWithdrawal: vi.fn(),
}));
vi.mock('../src/modules/wallets/razorpayx.service.js', () => ({
  isPayoutConfigured: vi.fn().mockReturnValue(true), requirePayoutConfig: vi.fn(),
}));
import { WalletEvent, WalletLedger, WalletTopup, WalletWithdrawal } from '../src/modules/wallets/wallet.model.js';
import { creditTopup, ensureWallet } from '../src/modules/wallets/wallet.service.js';
import { fetchPayment, fetchOrderPayments, verifyCheckoutSignature } from '../src/modules/payments/razorpay.service.js';
import { customerWalletRouter } from '../src/modules/wallets/wallet.routes.js';
import { requestWithdrawal } from '../src/modules/wallets/wallet-withdrawal.service.js';
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
it('returns live main, bonus, and held withdrawal balances', async () => {
  ensureWallet.mockResolvedValue({ customerId: 'customer', balancePaise: 245000,
    withdrawablePaise: 200000, restrictedPaise: 45000 });
  WalletLedger.find.mockReturnValue({ sort: () => ({ limit: () => ({ lean: async () => [] }) }) });
  WalletTopup.find.mockReturnValue({ sort: () => ({ limit: () => ({ lean: async () => [] }) }) });
  WalletEvent.findOne.mockReturnValue({ sort: () => ({ lean: async () => null }) });
  WalletWithdrawal.aggregate.mockResolvedValue([{ amountPaise: 15000 }]);
  const response = await request(app).get('/wallet');
  expect(response.status).toBe(200);
  expect(response.body.data).toMatchObject({ balancePaise: 245000, withdrawablePaise: 200000,
    restrictedPaise: 45000, lockedPaise: 15000 });
  expect(WalletWithdrawal.aggregate).toHaveBeenCalledWith([
    { $match: { customerId: 'customer', status: { $in: ['PENDING', 'PROCESSING'] } } },
    { $group: { _id: null, amountPaise: { $sum: '$amountPaise' } } },
  ]);
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
it('atomically claims a wallet credit celebration once', async () => {
  const event = { _id: id, amountPaise: 1000, title: 'Wallet credit received' };
  WalletEvent.findOneAndUpdate
    .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(event) })
    .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(null) });
  const first = await request(app).post('/wallet/events/claim').send({});
  const second = await request(app).post('/wallet/events/claim').send({});
  expect(first.status).toBe(200);
  expect(first.body.data.event.amountPaise).toBe(1000);
  expect(second.body.data.event).toBeNull();
  expect(WalletEvent.findOneAndUpdate).toHaveBeenCalledWith(
    { customerId: 'customer', seenAt: { $exists: false } },
    { $set: { seenAt: expect.any(Date) } },
    { new: true, sort: { createdAt: 1 } },
  );
});
it('submits a validated withdrawal for the authenticated customer', async () => {
  requestWithdrawal.mockResolvedValue({ _id: id, status: 'PENDING', amountPaise: 10000 });
  const response = await request(app).post('/wallet/withdrawals').send({
    amountPaise: 10000, vpa: 'customer@upi', idempotencyKey: 'withdrawal-request-key-1234',
  });
  expect(response.status).toBe(201);
  expect(requestWithdrawal).toHaveBeenCalledWith({ customerId: 'customer', amountPaise: 10000,
    vpa: 'customer@upi', idempotencyKey: 'withdrawal-request-key-1234' });
});
it('rejects invalid withdrawal amounts and UPI IDs before touching money', async () => {
  expect((await request(app).post('/wallet/withdrawals').send({
    amountPaise: 9999, vpa: 'not-upi', idempotencyKey: 'withdrawal-request-key-1234',
  })).status).toBe(422);
  expect(requestWithdrawal).not.toHaveBeenCalled();
});

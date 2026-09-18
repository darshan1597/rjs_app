import { vi } from 'vitest';
vi.mock('../src/config/env.js', () => ({ env: {} }));
vi.mock('../src/modules/wallets/wallet.model.js', () => ({ WalletTopup: { updateOne: vi.fn(), findOneAndUpdate: vi.fn() } }));
vi.mock('../src/modules/wallets/wallet.service.js', () => ({ creditTopup: vi.fn() }));
vi.mock('../src/modules/payments/razorpay.service.js', () => ({ fetchOrderPayments: vi.fn() }));
import { WalletTopup } from '../src/modules/wallets/wallet.model.js';
import { creditTopup } from '../src/modules/wallets/wallet.service.js';
import { fetchOrderPayments } from '../src/modules/payments/razorpay.service.js';
import { cleanupDecision, reconcileTopup, FAILED_GRACE_MS, ABANDONED_GRACE_MS } from '../src/modules/wallets/wallet-cleanup.service.js';
const now = Date.now();
const old = { _id: 'topup', orderId: 'order_test', status: 'PENDING', createdAt: new Date(now - 2 * ABANDONED_GRACE_MS) };
const failed = { order_id: old.orderId, status: 'failed', created_at: Math.floor((now - 2 * FAILED_GRACE_MS) / 1000) };
beforeEach(() => {
  vi.resetAllMocks();
  WalletTopup.updateOne.mockResolvedValue({ modifiedCount: 1 });
  WalletTopup.findOneAndUpdate.mockResolvedValue(old);
});
it('archives only empty orders older than 24 hours', () => {
  expect(cleanupDecision(old, { items: [] }, now)).toEqual({ archiveReason: 'ABANDONED' });
  expect(cleanupDecision({ ...old, createdAt: new Date(now - ABANDONED_GRACE_MS + 1) }, { items: [] }, now)).toEqual({});
});
it('waits 15 minutes after the most recent failed attempt or checkout reopen', () => {
  expect(cleanupDecision(old, { items: [failed] }, now)).toEqual({ archiveReason: 'FAILED_ATTEMPTS' });
  expect(cleanupDecision(old, { items: [{ ...failed, created_at: now / 1000 }] }, now)).toEqual({});
  expect(cleanupDecision({ ...old, lastOpenedAt: new Date(now - 1000) }, { items: [failed] }, now)).toEqual({});
});
it.each(['authorized', 'created', 'refunded', 'unknown'])('keeps %s attempts visible even alongside failures', (status) => {
  expect(cleanupDecision(old, { items: [failed, { ...failed, status }] }, now)).toEqual({});
});
it('never archives a failure with missing timing information', () => {
  expect(cleanupDecision(old, { items: [{ ...failed, created_at: undefined }] }, now)).toEqual({});
});
it.each([{ items: [], count: 1 }, {}, { items: [{ ...failed, order_id: 'other' }] }])('rejects incomplete or mismatched gateway responses', (response) => {
  expect(() => cleanupDecision(old, response, now)).toThrow();
});
it('credits captured payments even when their records were archived', async () => {
  const payment = { ...failed, status: 'captured' };
  fetchOrderPayments.mockResolvedValue({ items: [failed, payment] });
  expect(await reconcileTopup({ ...old, archivedAt: new Date() })).toEqual({ credited: true, archived: false });
  expect(creditTopup).toHaveBeenCalledWith(payment);
});
it('soft-archives with pending status and checkout-reopen race guards', async () => {
  fetchOrderPayments.mockResolvedValue({ items: [failed] });
  expect((await reconcileTopup(old)).archived).toBe(true);
  expect(WalletTopup.updateOne).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'PENDING', lastOpenedAt: { $exists: false } }),
    { $set: { archivedAt: expect.any(Date), archiveReason: 'FAILED_ATTEMPTS' } });
  expect(creditTopup).not.toHaveBeenCalled();
});
it('does not archive when the gateway is unavailable', async () => {
  fetchOrderPayments.mockRejectedValue(new Error('gateway unavailable'));
  await expect(reconcileTopup(old)).rejects.toThrow('gateway unavailable');
  expect(WalletTopup.updateOne).toHaveBeenCalledTimes(1);
  expect(WalletTopup.updateOne.mock.calls[0][1].$set.archivedAt).toBeUndefined();
});
it('does not duplicate checks if another worker claimed the record', async () => {
  WalletTopup.findOneAndUpdate.mockResolvedValue(null);
  expect(await reconcileTopup(old, { automatic: true })).toEqual({ credited: false, skipped: true });
  expect(fetchOrderPayments).not.toHaveBeenCalled();
});
it('reactivates an archived order if a later payment is authorized', async () => {
  fetchOrderPayments.mockResolvedValue({ items: [{ ...failed, status: 'authorized' }] });
  expect((await reconcileTopup({ ...old, archivedAt: new Date() })).archived).toBe(false);
  expect(WalletTopup.updateOne).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'PENDING' }), { $unset: { archivedAt: 1, archiveReason: 1 } });
});

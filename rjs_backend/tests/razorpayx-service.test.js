import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('../src/config/env.js', () => ({ env: {
  RAZORPAYX_KEY_ID: 'x_test_key', RAZORPAYX_KEY_SECRET: 'x_test_secret',
  RAZORPAYX_ACCOUNT_NUMBER: '2323230087654321', RAZORPAYX_WEBHOOK_SECRET: 'webhook-secret',
} }));

import { createVpaPayout, verifyPayoutWebhook } from '../src/modules/wallets/razorpayx.service.js';
import crypto from 'node:crypto';

beforeEach(() => vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true, json: vi.fn().mockResolvedValue({ id: 'pout_test', status: 'processing' }),
})));
afterEach(() => vi.unstubAllGlobals());

it('creates an idempotent UPI payout containing the internal withdrawal reference', async () => {
  const withdrawal = { id: 'a'.repeat(24), withdrawalId: 'WDR-TEST-123456', amountPaise: 12500, vpa: 'customer@upi' };
  const customer = { id: 'b'.repeat(24), name: 'Test Customer', phone: '9999999999', email: 'test@example.com' };
  await createVpaPayout(withdrawal, customer);
  const [url, options] = fetch.mock.calls[0];
  const body = JSON.parse(options.body);
  expect(url).toBe('https://api.razorpay.com/v1/payouts');
  expect(options.headers['X-Payout-Idempotency']).toBe(withdrawal.withdrawalId);
  expect(body).toEqual(expect.objectContaining({ amount: 12500, mode: 'UPI', purpose: 'payout',
    reference_id: withdrawal.withdrawalId }));
  expect(body.fund_account).toEqual(expect.objectContaining({ account_type: 'vpa', vpa: { address: 'customer@upi' } }));
  expect(body.notes.walletWithdrawalId).toBe(withdrawal.id);
});

it('verifies RazorpayX webhook signatures against the raw request body', () => {
  const body = Buffer.from('{"event":"payout.processed"}');
  const signature = crypto.createHmac('sha256', 'webhook-secret').update(body).digest('hex');
  expect(verifyPayoutWebhook(body, signature)).toBe(true);
  expect(verifyPayoutWebhook(body, '0'.repeat(64))).toBe(false);
});

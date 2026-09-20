import express from 'express';
import request from 'supertest';
import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('../src/modules/wallets/razorpayx.service.js', () => ({ verifyPayoutWebhook: vi.fn() }));
vi.mock('../src/modules/wallets/wallet.model.js', () => ({ WalletWithdrawal: { findOne: vi.fn() } }));
vi.mock('../src/modules/wallets/wallet-withdrawal.service.js', () => ({ settleWithdrawal: vi.fn() }));
vi.mock('../src/modules/payments/payment.model.js', () => ({
  RazorpayWebhookEvent: { create: vi.fn(), deleteOne: vi.fn() },
}));

import { verifyPayoutWebhook } from '../src/modules/wallets/razorpayx.service.js';
import { WalletWithdrawal } from '../src/modules/wallets/wallet.model.js';
import { settleWithdrawal } from '../src/modules/wallets/wallet-withdrawal.service.js';
import { RazorpayWebhookEvent } from '../src/modules/payments/payment.model.js';
import { razorpayxWebhookRouter } from '../src/modules/wallets/razorpayx-webhook.routes.js';

const app = express();
app.use('/webhook', razorpayxWebhookRouter);
const withdrawalId = 'a'.repeat(24);
const payload = (status) => ({ event: `payout.${status}`, payload: { payout: { entity: {
  id: 'pout_test', amount: 10000, status, utr: status === 'processed' ? 'UTR123' : null,
  notes: { walletWithdrawalId: withdrawalId },
} } } });
const send = (body) => request(app).post('/webhook').set('x-razorpay-event-id', `evt_${body.payload.payout.entity.status}`).send(body);

beforeEach(() => {
  vi.resetAllMocks();
  verifyPayoutWebhook.mockReturnValue(true);
  RazorpayWebhookEvent.create.mockResolvedValue({ _id: 'event', save: vi.fn() });
  WalletWithdrawal.findOne.mockResolvedValue({ id: withdrawalId, amountPaise: 10000 });
});

it('settles a processed RazorpayX withdrawal', async () => {
  expect((await send(payload('processed'))).status).toBe(200);
  expect(settleWithdrawal).toHaveBeenCalledWith(withdrawalId, expect.objectContaining({ id: 'pout_test', status: 'processed' }));
});

it('routes failed payouts through the balance-release settlement', async () => {
  expect((await send(payload('failed'))).status).toBe(200);
  expect(settleWithdrawal).toHaveBeenCalledWith(withdrawalId, expect.objectContaining({ status: 'failed' }));
});

it('rejects payout webhooks with an invalid signature', async () => {
  verifyPayoutWebhook.mockReturnValue(false);
  expect((await send(payload('processed'))).status).toBe(401);
  expect(settleWithdrawal).not.toHaveBeenCalled();
});

import crypto from 'node:crypto';
import { AppError } from '../../common/errors/app-error.js';
import { env } from '../../config/env.js';

const endpoint = 'https://api.razorpay.com/v1';

function requirePayoutConfig() {
  if (!isPayoutConfigured()) {
    throw new AppError(503, 'PAYOUT_GATEWAY_NOT_CONFIGURED', 'RazorpayX withdrawals are not configured yet');
  }
}
const isPayoutConfigured = () => Boolean(env.RAZORPAYX_KEY_ID && env.RAZORPAYX_KEY_SECRET
  && env.RAZORPAYX_ACCOUNT_NUMBER && env.RAZORPAYX_WEBHOOK_SECRET);

async function createVpaPayout(withdrawal, customer) {
  requirePayoutConfig();
  const response = await fetch(`${endpoint}/payouts`, {
    method: 'POST',
    signal: AbortSignal.timeout(15000),
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.RAZORPAYX_KEY_ID}:${env.RAZORPAYX_KEY_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/json',
      'X-Payout-Idempotency': withdrawal.withdrawalId,
    },
    body: JSON.stringify({
      account_number: env.RAZORPAYX_ACCOUNT_NUMBER,
      amount: withdrawal.amountPaise,
      currency: 'INR',
      mode: 'UPI',
      purpose: 'payout',
      queue_if_low_balance: true,
      reference_id: withdrawal.withdrawalId,
      narration: 'RJS Wallet Withdrawal',
      fund_account: {
        account_type: 'vpa',
        vpa: { address: withdrawal.vpa },
        contact: {
          name: customer.name || 'RJS Customer',
          contact: customer.phone,
          ...(customer.email ? { email: customer.email } : {}),
          type: 'customer',
          reference_id: customer.id,
        },
      },
      notes: { walletWithdrawalId: withdrawal.id, withdrawalId: withdrawal.withdrawalId },
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new AppError(502, 'RAZORPAYX_REQUEST_FAILED', result.error?.description || 'RazorpayX could not process the withdrawal');
  return result;
}

function verifyPayoutWebhook(rawBody, signature) {
  if (!env.RAZORPAYX_WEBHOOK_SECRET || !signature) return false;
  const expected = crypto.createHmac('sha256', env.RAZORPAYX_WEBHOOK_SECRET).update(rawBody).digest('hex');
  return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export { createVpaPayout, isPayoutConfigured, requirePayoutConfig, verifyPayoutWebhook };

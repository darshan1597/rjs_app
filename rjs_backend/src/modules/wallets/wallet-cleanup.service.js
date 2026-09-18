import { AppError } from '../../common/errors/app-error.js';
import { env } from '../../config/env.js';
import { WalletTopup } from './wallet.model.js';
import { creditTopup } from './wallet.service.js';
import { fetchOrderPayments } from '../payments/razorpay.service.js';

const MINUTE = 60000;
export const FAILED_GRACE_MS = 15 * MINUTE;
export const ABANDONED_GRACE_MS = 24 * 60 * MINUTE;
const CHECK_INTERVAL_MS = 5 * MINUTE;
// Archiving affects display only. Recheck archived unpaid records daily forever
// so a missing webhook does not permanently lose a late capture.
export function cleanupDecision(topup, response, now = Date.now()) {
  if (!Array.isArray(response?.items) ||
      (response.count !== undefined && (!Number.isInteger(response.count) || response.count !== response.items.length))) {
    throw new AppError(502, 'INVALID_PAYMENT_RESPONSE', 'Payment status could not be confirmed. Please check again later.');
  }
  const items = response.items;
  if (items.some((payment) => payment.order_id !== topup.orderId)) {
    throw new AppError(502, 'INVALID_PAYMENT_RESPONSE', 'Payment order details could not be confirmed');
  }
  const captured = items.find((payment) => payment.status === 'captured');
  if (captured) return { captured };
  const lastActivity = Math.max(new Date(topup.createdAt).getTime(),
    topup.lastOpenedAt ? new Date(topup.lastOpenedAt).getTime() : 0);
  if (!Number.isFinite(lastActivity) || lastActivity > now) return {};
  if (items.length === 0) {
    return now - lastActivity >= ABANDONED_GRACE_MS ? { archiveReason: 'ABANDONED' } : {};
  }
  // An individual failed attempt does not make the whole order failed.
  // Unknown, created, authorized, or refunded states must never be archived.
  if (items.every((payment) => payment.status === 'failed' && Number.isFinite(payment.created_at))) {
    const mostRecent = Math.max(lastActivity, ...items.map((payment) => payment.created_at * 1000));
    if (now - mostRecent >= FAILED_GRACE_MS) return { archiveReason: 'FAILED_ATTEMPTS' };
  }
  return {};
}

export async function reconcileTopup(topup, { automatic = false } = {}) {
  if (topup.status === 'CREDITED') return { credited: true, archived: false };
  const now = new Date();
  if (automatic) {
    const interval = topup.archivedAt ? ABANDONED_GRACE_MS : CHECK_INTERVAL_MS;
    topup = await WalletTopup.findOneAndUpdate({ _id: topup._id, status: 'PENDING',
      $or: [{ lastCheckedAt: { $exists: false } }, { lastCheckedAt: { $lte: new Date(now.getTime() - interval) } }] },
    { $set: { lastCheckedAt: now } }, { new: true });
    if (!topup) return { credited: false, skipped: true };
  } else {
    await WalletTopup.updateOne({ _id: topup._id, status: 'PENDING' }, { $set: { lastCheckedAt: now } });
  }
  const response = await fetchOrderPayments(topup.orderId);
  const decision = cleanupDecision(topup, response);
  if (decision.captured) {
    await creditTopup(decision.captured);
    return { credited: true, archived: false };
  }
  if (decision.archiveReason) {
    const updated = await WalletTopup.updateOne({ _id: topup._id, status: 'PENDING',
      lastOpenedAt: topup.lastOpenedAt ?? { $exists: false }, archivedAt: { $exists: false } },
    { $set: { archivedAt: new Date(), archiveReason: decision.archiveReason } });
    return { credited: false, archived: Boolean(updated.modifiedCount || topup.archivedAt), reason: decision.archiveReason };
  }
  // A retry or late authorization can make an archived record active again.
  await WalletTopup.updateOne({ _id: topup._id, status: 'PENDING',
    lastOpenedAt: topup.lastOpenedAt ?? { $exists: false } },
  { $unset: { archivedAt: 1, archiveReason: 1 } });
  return { credited: false, archived: false };
}

export async function sweepWalletTopups({ customerId, limit = 20 } = {}) {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) return;
  const now = Date.now();
  const candidates = await WalletTopup.find({ ...(customerId ? { customerId } : {}),
    status: 'PENDING', orderId: { $exists: true }, createdAt: { $lte: new Date(now - FAILED_GRACE_MS) },
    $or: [
      { archivedAt: { $exists: false }, $or: [{ lastCheckedAt: { $exists: false } }, { lastCheckedAt: { $lte: new Date(now - CHECK_INTERVAL_MS) } }] },
      { archivedAt: { $exists: true }, $or: [{ lastCheckedAt: { $exists: false } }, { lastCheckedAt: { $lte: new Date(now - ABANDONED_GRACE_MS) } }] },
    ] }).sort({ lastCheckedAt: 1, createdAt: 1 }).limit(limit);
  for (const topup of candidates) {
    try { await reconcileTopup(topup, { automatic: true }); }
    catch (error) { console.warn('Wallet reconciliation postponed', { topupId: topup.id, code: error.code ?? 'GATEWAY_UNAVAILABLE' }); }
  }
}

export function startWalletCleanup() {
  let running;
  const timer = setInterval(() => {
    if (running) return;
    running = sweepWalletTopups().catch(() => console.warn('Wallet cleanup sweep postponed'))
      .finally(() => { running = null; });
  }, MINUTE);
  timer.unref();
  return async () => { clearInterval(timer); await running; };
}

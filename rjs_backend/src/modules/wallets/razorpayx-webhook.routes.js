import express from 'express';
import { RazorpayWebhookEvent } from '../payments/payment.model.js';
import { WalletWithdrawal } from './wallet.model.js';
import { settleWithdrawal } from './wallet-withdrawal.service.js';
import { verifyPayoutWebhook } from './razorpayx.service.js';

const router = express.Router();
router.post('/', express.raw({ type: 'application/json', limit: '1mb' }), async (req, res, next) => {
  let eventRecord;
  try {
    if (!verifyPayoutWebhook(req.body, req.get('X-Razorpay-Signature') || '')) return res.status(401).json({ success: false });
    const eventId = req.get('x-razorpay-event-id');
    if (!eventId) return res.status(400).json({ success: false, error: 'Missing event id' });
    const payload = JSON.parse(req.body.toString('utf8'));
    try { eventRecord = await RazorpayWebhookEvent.create({ eventId, eventType: payload.event }); }
    catch (error) { if (error?.code === 11000) return res.json({ success: true, duplicate: true }); throw error; }
    const payout = payload.payload?.payout?.entity;
    const internalId = payout?.notes?.walletWithdrawalId;
    const withdrawal = payout ? await WalletWithdrawal.findOne({ $or: [
      { gatewayPayoutId: payout.id },
      ...(/^[a-f\d]{24}$/i.test(internalId || '') ? [{ _id: internalId }] : []),
    ] }) : null;
    if (withdrawal && withdrawal.amountPaise === payout.amount) {
      await settleWithdrawal(withdrawal.id, payout);
      eventRecord.status = 'PROCESSED';
      eventRecord.paymentId = payout.id;
    } else eventRecord.status = 'IGNORED';
    eventRecord.processedAt = new Date();
    await eventRecord.save();
    res.json({ success: true });
  } catch (error) {
    if (eventRecord?._id) await RazorpayWebhookEvent.deleteOne({ _id: eventRecord._id }).catch(() => {});
    next(error);
  }
});

export { router as razorpayxWebhookRouter };

import { writeAuditLog } from "../audit/audit.service.js";
import {
    createRefundRequest as createRefundRecord,
    listPayments as listRecords,
    retryPayout as retryRecord,
    reviewRefund as reviewRecord,
} from "./payment.service.js";
async function createRefundRequest(req, res, next) {
    try {
        const item = await createRefundRecord(req.validated.params.paymentId, req.validated.body, req.admin.id);
        await writeAuditLog({ req, action: "refund.request", actor: req.admin, targetType: "Refund", targetId: item.id,
            metadata: { paymentId: req.validated.params.paymentId, amount: item.eligibleAmount, reason: item.reason } });
        return res.status(201).json({ success: true, data: item });
    } catch (error) { return next(error); }
}
async function listPayments(req, res, next) {
    try {
        return res.json({
            success: true,
            data: await listRecords(req.validated.query),
        });
    } catch (error) {
        return next(error);
    }
}
async function retryPayout(req, res, next) {
    try {
        const item = await retryRecord(req.validated.params.payoutId);
        await writeAuditLog({
            req,
            action: "payout.retry",
            actor: req.admin,
            targetType: "DriverPayout",
            targetId: item.id,
        });
        return res.json({ success: true, data: item });
    } catch (error) {
        return next(error);
    }
}
async function reviewRefund(req, res, next) {
    try {
        const item = await reviewRecord(
            req.validated.params.refundId,
            req.validated.body,
            req.admin.id,
        );
        await writeAuditLog({
            req,
            action: `refund.${req.validated.body.decision.toLowerCase()}`,
            actor: req.admin,
            targetType: "Refund",
            targetId: item.id,
            metadata: { note: req.validated.body.note },
        });
        return res.json({ success: true, data: item });
    } catch (error) {
        return next(error);
    }
}
export { createRefundRequest, listPayments, retryPayout, reviewRefund };

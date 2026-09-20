import express from 'express';
import { validate } from '../../common/middleware/validate.js';
import { authenticateAdmin, requireEmployee, requireSuperAdmin } from '../admins/admin-auth.middleware.js';
import { writeAuditLog } from '../audit/audit.service.js';
import { createLimiter } from '../../common/middleware/rate-limits.js';
import { listAdminWalletsSchema, adminWalletDetailsSchema, adjustmentRequestSchema, listAdjustmentsSchema, reviewAdjustmentSchema,
  listWithdrawalsSchema, reviewWithdrawalSchema } from './admin-wallet.schemas.js';
import { listAdminWallets, getAdminWalletDetails, requestWalletAdjustment, listWalletAdjustments, reviewWalletAdjustment } from './admin-wallet.service.js';
import { listAdminWithdrawals, reviewWithdrawal } from './wallet-withdrawal.service.js';

const adminWalletRouter = express.Router();
const adjustmentLimiter = createLimiter({ windowMs: 60 * 1000, limit: 10, keyGenerator: (req) => `admin:${req.admin.id}` });
adminWalletRouter.use(authenticateAdmin);
adminWalletRouter.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
adminWalletRouter.get('/', validate(listAdminWalletsSchema), async (req, res, next) => {
  try { res.json({ success: true, data: await listAdminWallets(req.validated.query) }); }
  catch (error) { next(error); }
});
adminWalletRouter.get('/adjustments', validate(listAdjustmentsSchema), async (req, res, next) => {
  try { res.json({ success: true, data: { items: await listWalletAdjustments({ ...req.validated.query, admin: req.admin }) } }); }
  catch (error) { next(error); }
});
adminWalletRouter.get('/withdrawals', requireEmployee, validate(listWithdrawalsSchema), async (req, res, next) => {
  try { res.json({ success: true, data: { items: await listAdminWithdrawals(req.validated.query) } }); }
  catch (error) { next(error); }
});
adminWalletRouter.post('/withdrawals/:withdrawalId/review', requireSuperAdmin, adjustmentLimiter,
  validate(reviewWithdrawalSchema), async (req, res, next) => {
    try {
      const item = await reviewWithdrawal({ withdrawalId: req.validated.params.withdrawalId, reviewerId: req.admin.id,
        decision: req.validated.body.decision, note: req.validated.body.note });
      await writeAuditLog({ req, action: `wallet.withdrawal.${req.validated.body.decision.toLowerCase()}`, actor: req.admin,
        targetType: 'WalletWithdrawal', targetId: item.id, metadata: { amountPaise: item.amountPaise, note: req.validated.body.note } });
      res.json({ success: true, data: item });
    } catch (error) { next(error); }
  });
adminWalletRouter.post('/:customerId/adjustments', requireEmployee, adjustmentLimiter, validate(adjustmentRequestSchema), async (req, res, next) => {
  try {
    const adjustment = await requestWalletAdjustment({ ...req.validated.body, customerId: req.validated.params.customerId,
      requestedBy: req.admin.id, ip: req.ip, userAgent: req.get('user-agent') });
    await writeAuditLog({ req, action: 'wallet.adjustment.request', actor: req.admin, targetType: 'WalletAdjustment',
      targetId: adjustment.id, metadata: { customerId: req.validated.params.customerId, type: adjustment.type, amountPaise: adjustment.amountPaise, reason: adjustment.reason } })
      .catch((error) => console.error('Wallet adjustment audit mirror failed', { adjustmentId: adjustment.id, code: error.code ?? 'AUDIT_WRITE_FAILED' }));
    res.status(201).json({ success: true, data: adjustment });
  } catch (error) { next(error); }
});
adminWalletRouter.post('/adjustments/:adjustmentId/review', requireSuperAdmin, adjustmentLimiter, validate(reviewAdjustmentSchema), async (req, res, next) => {
  try {
    const result = await reviewWalletAdjustment({ adjustmentId: req.validated.params.adjustmentId, reviewerId: req.admin.id,
      decision: req.validated.body.decision, note: req.validated.body.note, ip: req.ip, userAgent: req.get('user-agent') });
    const adjustment = result.adjustment;
    if (result.changed) await writeAuditLog({ req, action: `wallet.adjustment.${req.validated.body.decision.toLowerCase()}`, actor: req.admin,
      targetType: 'WalletAdjustment', targetId: adjustment.id,
      metadata: { decision: req.validated.body.decision, note: req.validated.body.note, customerId: adjustment.customerId,
        type: adjustment.type, amountPaise: adjustment.amountPaise, balanceBeforePaise: adjustment.balanceBeforePaise,
        balanceAfterPaise: adjustment.balanceAfterPaise } }).catch((error) => console.error('Wallet adjustment audit mirror failed', { adjustmentId: adjustment.id, code: error.code ?? 'AUDIT_WRITE_FAILED' }));
    res.json({ success: true, data: adjustment });
  } catch (error) { next(error); }
});
adminWalletRouter.get('/:customerId', validate(adminWalletDetailsSchema), async (req, res, next) => {
  try { res.json({ success: true, data: await getAdminWalletDetails(req.validated.params.customerId, req.validated.query.limit) }); }
  catch (error) { next(error); }
});

export { adminWalletRouter };

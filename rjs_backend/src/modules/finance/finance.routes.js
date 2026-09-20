import express from 'express';
import { authenticateAdmin, requireSuperAdmin } from '../admins/admin-auth.middleware.js';
import { validate } from '../../common/middleware/validate.js';
import { financeOverviewSchema } from './finance.schemas.js';
import { getFinanceOverview } from './finance.service.js';

const financeRouter = express.Router();
financeRouter.use(authenticateAdmin, requireSuperAdmin, (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
financeRouter.get('/', validate(financeOverviewSchema), async (req, res, next) => {
  try { res.json({ success: true, data: await getFinanceOverview(req.validated.query.period) }); }
  catch (error) { next(error); }
});
export { financeRouter };

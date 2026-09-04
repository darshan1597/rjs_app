import express from 'express';
import { authenticateAdmin, requireSuperAdmin } from '../admins/admin-auth.middleware.js';
import { dashboard } from './admin-dashboard.controller.js';
const adminDashboardRouter = express.Router();
adminDashboardRouter.get('/', authenticateAdmin, requireSuperAdmin, dashboard);
export { adminDashboardRouter };

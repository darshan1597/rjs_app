import express from 'express';
import { authenticateAdmin, requireEmployee } from '../admins/admin-auth.middleware.js';
import { employeeDashboard } from './employee-dashboard.controller.js';

const employeeDashboardRouter = express.Router();

employeeDashboardRouter.get('/', authenticateAdmin, requireEmployee, employeeDashboard);

export { employeeDashboardRouter };

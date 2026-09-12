import express from 'express';
import { validate } from '../../common/middleware/validate.js';
import { authenticateAdmin, requirePermission } from '../admins/admin-auth.middleware.js';
import { listAuditLogs } from './audit.controller.js';
import { auditListSchema } from './audit.schemas.js';

const auditRouter = express.Router();

auditRouter.get('/', authenticateAdmin, requirePermission('audit_logs.view'), validate(auditListSchema), listAuditLogs);

export { auditRouter };

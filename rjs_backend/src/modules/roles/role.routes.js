import express from 'express';
import { validate } from '../../common/middleware/validate.js';
import { authenticateAdmin, requirePermission } from '../admins/admin-auth.middleware.js';
import { createRole, listPermissions, listRoles, updateRole } from './role.controller.js';
import { createRoleSchema, updateRoleSchema } from './role.schemas.js';

const roleRouter = express.Router();
roleRouter.use(authenticateAdmin);
roleRouter.get('/permissions', requirePermission('roles.view'), listPermissions);
roleRouter.get('/', requirePermission('roles.view'), listRoles);
roleRouter.post('/', requirePermission('roles.create'), validate(createRoleSchema), createRole);
roleRouter.patch('/:roleId', requirePermission('roles.update'), validate(updateRoleSchema), updateRole);
export { roleRouter };

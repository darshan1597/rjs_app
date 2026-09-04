import { AppError } from '../../common/errors/app-error.js';
import { writeAuditLog } from '../audit/audit.service.js';
import { PERMISSIONS } from './permission-catalog.js';
import { createRole as createRecord, listRoles as listRecords, updateRole as updateRecord } from './role.service.js';

const listPermissions = (req, res) => res.json({ success: true, data: PERMISSIONS });
async function listRoles(req, res, next) { try { return res.json({ success: true, data: await listRecords() }); } catch (error) { return next(error); } }
async function createRole(req, res, next) {
  try {
    const role = await createRecord(req.validated.body, req.admin.id);
    await writeAuditLog({ req, action: 'role.create', actor: req.admin, targetType: 'Role', targetId: role.id, metadata: { permissions: role.permissions } });
    return res.status(201).json({ success: true, data: role });
  } catch (error) {
    if (error.code === 11000) return next(new AppError(409, 'ROLE_NAME_IN_USE', 'A role with this name already exists'));
    return next(error);
  }
}
async function updateRole(req, res, next) {
  try {
    const role = await updateRecord(req.validated.params.roleId, req.validated.body, req.admin.id);
    await writeAuditLog({ req, action: 'role.update', actor: req.admin, targetType: 'Role', targetId: role.id, metadata: req.validated.body });
    return res.json({ success: true, data: role });
  } catch (error) { return next(error); }
}
export { createRole, listPermissions, listRoles, updateRole };

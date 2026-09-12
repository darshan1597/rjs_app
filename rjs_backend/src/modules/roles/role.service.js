import { AppError } from '../../common/errors/app-error.js';
import { Role } from './role.model.js';

const listRoles = () => Role.find().sort({ name: 1 });
const createRole = (data, adminId) => Role.create({ ...data, createdBy: adminId, updatedBy: adminId });

async function updateRole(roleId, changes, adminId) {
  const role = await Role.findById(roleId);

  if (!role) throw new AppError(404, 'ROLE_NOT_FOUND', 'Role was not found');

  if (role.isSystem) throw new AppError(409, 'SYSTEM_ROLE_IMMUTABLE', 'System roles cannot be modified');

  Object.assign(role, changes, { updatedBy: adminId });
  return role.save();
}

export { createRole, listRoles, updateRole };

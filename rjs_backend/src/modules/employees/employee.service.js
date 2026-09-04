import bcrypt from 'bcryptjs';
import { AppError } from '../../common/errors/app-error.js';
import { AdminAccount } from '../admins/admin-account.model.js';
import { AdminLoginChallenge } from '../admins/admin-login-challenge.model.js';
import { AdminSession } from '../admins/admin-session.model.js';
async function listEmployees({ page, limit, search, status }) {
  const filter = { accountType: 'EMPLOYEE' };
  if (status) filter.status = status;
  if (search) { const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); filter.$or = [{ name: { $regex: escaped, $options: 'i' } }, { email: { $regex: escaped, $options: 'i' } }]; }
  const [items, total] = await Promise.all([AdminAccount.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), AdminAccount.countDocuments(filter)]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}
async function createEmployee(data, creatorId) {
  if (await AdminAccount.exists({ email: data.email.toLowerCase() })) throw new AppError(409, 'EMAIL_IN_USE', 'An admin account already uses this email');
  return AdminAccount.create({ name: data.name, email: data.email, passwordHash: await bcrypt.hash(data.temporaryPassword, 12), accountType: 'EMPLOYEE', roleIds: [], mustChangePassword: true, createdBy: creatorId });
}
async function updateEmployee(employeeId, changes) {
  const employee = await AdminAccount.findOneAndUpdate({ _id: employeeId, accountType: 'EMPLOYEE' }, changes, { new: true, runValidators: true });
  if (!employee) throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Employee was not found');
  if (changes.status === 'DISABLED') {
    await Promise.all([
      AdminSession.updateMany({ adminId: employee.id, revokedAt: null }, { revokedAt: new Date() }),
      AdminLoginChallenge.updateMany({ adminId: employee.id, consumedAt: null }, { consumedAt: new Date() }),
    ]);
  }
  return employee;
}
async function resetEmployeeMfa(employeeId) {
  const employee = await AdminAccount.findOne({ _id: employeeId, accountType: 'EMPLOYEE' });
  if (!employee) throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Employee was not found');
  employee.mfa = { enabled: false };
  await employee.save();
  await Promise.all([
    AdminSession.updateMany({ adminId: employee.id, revokedAt: null }, { revokedAt: new Date() }),
    AdminLoginChallenge.updateMany({ adminId: employee.id, consumedAt: null }, { consumedAt: new Date() }),
  ]);
  return employee;
}
export { createEmployee, listEmployees, resetEmployeeMfa, updateEmployee };

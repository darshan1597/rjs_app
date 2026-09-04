import { AppError } from '../../common/errors/app-error.js';
import { verifyAdminAccessToken } from '../../common/security/tokens.js';
import { Role } from '../roles/role.model.js';
import { AdminAccount } from './admin-account.model.js';
import { AdminSession } from './admin-session.model.js';

async function authenticateAdmin(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new AppError(401, 'AUTH_REQUIRED', 'Admin authentication is required');
    const payload = verifyAdminAccessToken(token);
    if (payload.tokenType !== 'access' || payload.actorType !== 'admin') throw new Error('Invalid token type');
    const session = payload.sid ? await AdminSession.findById(payload.sid).select('revokedAt expiresAt') : null;
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new AppError(401, 'SESSION_UNAVAILABLE', 'The admin session is no longer active');
    }
    const admin = await AdminAccount.findById(payload.sub);
    if (!admin || admin.status !== 'ACTIVE') throw new AppError(401, 'ACCOUNT_UNAVAILABLE', 'The admin account is unavailable');
    let permissions = [];
    if (admin.accountType !== 'SUPER_ADMIN' && admin.roleIds.length) {
      const roles = await Role.find({ _id: { $in: admin.roleIds } }).select('permissions');
      permissions = [...new Set(roles.flatMap((role) => role.permissions))];
    }
    req.admin = admin;
    req.adminSessionId = payload.sid;
    req.adminPermissions = permissions;
    return next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    return next(new AppError(401, 'INVALID_TOKEN', 'The access token is invalid or expired'));
  }
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (req.admin?.accountType === 'EMPLOYEE' && req.admin.mustChangePassword) {
      return next(new AppError(403, 'PASSWORD_CHANGE_REQUIRED', 'Change your temporary password before continuing'));
    }
    if (req.admin?.accountType === 'SUPER_ADMIN' || req.adminPermissions?.includes(permission)) return next();
    return next(new AppError(403, 'PERMISSION_DENIED', `Permission '${permission}' is required`));
  };
}
function requireSuperAdmin(req, res, next) {
  if (req.admin?.accountType === 'SUPER_ADMIN') return next();
  return next(new AppError(403, 'SUPER_ADMIN_REQUIRED', 'Super Admin access is required'));
}
function requireEmployee(req, res, next) {
  if (req.admin?.accountType === 'EMPLOYEE') return next();
  return next(new AppError(403, 'EMPLOYEE_REQUIRED', 'Employee access is required'));
}

export { authenticateAdmin, requireEmployee, requirePermission, requireSuperAdmin };

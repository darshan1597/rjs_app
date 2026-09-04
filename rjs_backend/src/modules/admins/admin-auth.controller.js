import { writeAuditLog } from '../audit/audit.service.js';
import { beginMfaSetup, changeAdminPassword, completeMfaSetup, loginAdmin, logoutAdmin, logoutAdminEverywhere, refreshAdminTokens, verifyAdminMfa } from './admin-auth.service.js';

const requestMeta = (req) => ({ ip: req.ip, userAgent: req.get('user-agent') });
async function login(req, res, next) {
  try {
    const result = await loginAdmin(req.validated.body);
    return res.json({ success: true, data: { admin: result.admin.toSafeObject(), challengeToken: result.challengeToken, mfaRequired: result.mfaRequired, mfaSetupRequired: result.mfaSetupRequired } });
  } catch (error) { return next(error); }
}
async function setupMfa(req, res, next) { try { return res.json({ success: true, data: await beginMfaSetup(req.validated.body.challengeToken) }); } catch (error) { return next(error); } }
async function verifyMfaSetup(req, res, next) {
  try {
    const result = await completeMfaSetup({ ...req.validated.body, requestMeta: requestMeta(req) });
    await writeAuditLog({ req, action: 'admin.mfa.enabled', actor: result.admin, targetType: 'AdminAccount', targetId: result.admin.id });
    return res.json({ success: true, data: { admin: result.admin.toSafeObject(), recoveryCodes: result.recoveryCodes, tokens: result.tokens } });
  } catch (error) { return next(error); }
}
async function verifyMfa(req, res, next) {
  try {
    const result = await verifyAdminMfa({ ...req.validated.body, requestMeta: requestMeta(req) });
    await writeAuditLog({ req, action: 'admin.login', actor: result.admin, targetType: 'AdminAccount', targetId: result.admin.id });
    return res.json({ success: true, data: { admin: result.admin.toSafeObject(), tokens: result.tokens } });
  } catch (error) { return next(error); }
}
async function refresh(req, res, next) { try { return res.json({ success: true, data: { tokens: await refreshAdminTokens(req.validated.body.refreshToken, requestMeta(req)) } }); } catch (error) { return next(error); } }
async function logout(req, res, next) { try { await logoutAdmin(req.validated.body.refreshToken); return res.json({ success: true, data: { loggedOut: true } }); } catch (error) { return next(error); } }
async function changePassword(req, res, next) {
  try {
    const admin = await changeAdminPassword({ adminId: req.admin.id, currentSessionId: req.adminSessionId, ...req.validated.body });
    await writeAuditLog({ req, action: 'admin.password.changed', actor: admin, targetType: 'AdminAccount', targetId: admin.id });
    return res.json({ success: true, data: { admin: admin.toSafeObject() } });
  } catch (error) { return next(error); }
}
async function logoutAll(req, res, next) {
  try {
    await logoutAdminEverywhere(req.admin.id);
    await writeAuditLog({ req, action: 'admin.sessions.revoked', actor: req.admin, targetType: 'AdminAccount', targetId: req.admin.id });
    return res.json({ success: true, data: { loggedOut: true } });
  } catch (error) { return next(error); }
}
function me(req, res) { return res.json({ success: true, data: { admin: req.admin.toSafeObject(), permissions: req.admin.accountType === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : req.adminPermissions } }); }
export { changePassword, login, logout, logoutAll, me, refresh, setupMfa, verifyMfa, verifyMfaSetup };

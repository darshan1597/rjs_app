import bcrypt from 'bcryptjs';
import { generateSecret, generateURI, verify as verifyTotp } from 'otplib';
import QRCode from 'qrcode';
import { AppError } from '../../common/errors/app-error.js';
import { createRecoveryCodes, decryptMfaSecret, encryptMfaSecret, hashRecoveryCode } from '../../common/security/mfa-crypto.js';
import { hashToken, signAdminAccessToken, signAdminRefreshToken, signMfaChallengeToken, verifyAdminRefreshToken, verifyMfaChallengeToken } from '../../common/security/tokens.js';
import { env } from '../../config/env.js';
import { AdminAccount } from './admin-account.model.js';
import { AdminLoginChallenge } from './admin-login-challenge.model.js';
import { AdminSession } from './admin-session.model.js';
import { SystemSettings } from '../settings/system-settings.model.js';

const sessionExpiry = () => new Date(Date.now() + env.ADMIN_SESSION_TTL_HOURS * 60 * 60 * 1000);
const challengeExpiry = () => new Date(Date.now() + 5 * 60 * 1000);

async function issueTokens(admin, requestMeta, currentSession) {
  const session = currentSession || new AdminSession({ adminId: admin.id, userAgent: requestMeta.userAgent, ip: requestMeta.ip, expiresAt: sessionExpiry() });
  const refreshToken = signAdminRefreshToken(admin.id, session.id);
  session.refreshTokenHash = hashToken(refreshToken);
  session.lastUsedAt = new Date();
  session.expiresAt = sessionExpiry();
  await session.save();
  return { accessToken: signAdminAccessToken(admin, session.id), refreshToken };
}

async function createChallenge(admin, purpose) {
  await AdminLoginChallenge.updateMany({ adminId: admin.id, consumedAt: null }, { consumedAt: new Date() });
  const challenge = await AdminLoginChallenge.create({ adminId: admin.id, purpose, expiresAt: challengeExpiry() });
  return signMfaChallengeToken(admin.id, challenge.id, purpose);
}

async function loadChallenge(challengeToken, expectedPurpose) {
  let payload;
  try { payload = verifyMfaChallengeToken(challengeToken); } catch (_) { throw new AppError(401, 'INVALID_MFA_CHALLENGE', 'The MFA challenge is invalid or expired'); }
  if (payload.purpose !== expectedPurpose || payload.tokenType !== 'mfa_challenge') throw new AppError(401, 'INVALID_MFA_CHALLENGE', 'The MFA challenge is invalid');
  const challenge = await AdminLoginChallenge.findOne({ _id: payload.cid, adminId: payload.sub, purpose: expectedPurpose });
  if (!challenge || challenge.consumedAt || challenge.expiresAt <= new Date()) throw new AppError(401, 'INVALID_MFA_CHALLENGE', 'The MFA challenge is invalid or expired');
  if (challenge.attempts >= 5) throw new AppError(429, 'MFA_ATTEMPTS_EXCEEDED', 'Too many verification attempts; sign in again');
  return { challenge, adminId: payload.sub };
}

async function rejectMfaAttempt(challenge) {
  challenge.attempts += 1;
  if (challenge.attempts >= 5) challenge.consumedAt = new Date();
  await challenge.save();
  throw new AppError(401, 'INVALID_MFA_CODE', 'The authenticator or recovery code is incorrect');
}

async function loginAdmin({ email, password }) {
  const admin = await AdminAccount.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
  if (admin.status !== 'ACTIVE') throw new AppError(403, 'ACCOUNT_DISABLED', 'This admin account is disabled');
  if (admin.accountType === 'EMPLOYEE') {
    const settings = await SystemSettings.findOne({ singletonKey: 'GLOBAL' }).select('security.employeeLoginBlocked');
    if (settings?.security?.employeeLoginBlocked) throw new AppError(403, 'EMPLOYEE_LOGIN_BLOCKED', 'Employee login is temporarily unavailable');
  }
  const purpose = admin.mfa?.enabled ? 'MFA_VERIFY' : 'MFA_SETUP';
  return { admin, challengeToken: await createChallenge(admin, purpose), mfaRequired: purpose === 'MFA_VERIFY', mfaSetupRequired: purpose === 'MFA_SETUP' };
}

async function beginMfaSetup(challengeToken) {
  const { adminId } = await loadChallenge(challengeToken, 'MFA_SETUP');
  const admin = await AdminAccount.findById(adminId).select('+mfa.pendingEncryptedSecret');
  if (!admin || admin.status !== 'ACTIVE' || admin.mfa?.enabled) throw new AppError(409, 'MFA_SETUP_UNAVAILABLE', 'MFA setup is not available');
  let secret;
  if (admin.mfa?.pendingEncryptedSecret) secret = decryptMfaSecret(admin.mfa.pendingEncryptedSecret);
  else {
    secret = generateSecret();
    admin.mfa.pendingEncryptedSecret = encryptMfaSecret(secret);
    await admin.save();
  }
  const uri = generateURI({ issuer: 'RJS Admin', label: admin.email, secret });
  return { qrCodeDataUrl: await QRCode.toDataURL(uri), manualKey: secret, issuer: 'RJS Admin', account: admin.email };
}

async function completeMfaSetup({ challengeToken, code, requestMeta }) {
  const { challenge, adminId } = await loadChallenge(challengeToken, 'MFA_SETUP');
  const admin = await AdminAccount.findById(adminId).select('+mfa.pendingEncryptedSecret');
  if (!admin?.mfa?.pendingEncryptedSecret) throw new AppError(409, 'MFA_SETUP_NOT_STARTED', 'Start MFA setup before verifying a code');
  const secret = decryptMfaSecret(admin.mfa.pendingEncryptedSecret);
  if (!(await verifyTotp({ secret, token: code })).valid) return rejectMfaAttempt(challenge);
  const recoveryCodes = createRecoveryCodes();
  admin.mfa.enabled = true;
  admin.mfa.encryptedSecret = encryptMfaSecret(secret);
  admin.mfa.pendingEncryptedSecret = undefined;
  admin.mfa.recoveryCodeHashes = recoveryCodes.map(hashRecoveryCode);
  admin.mfa.verifiedAt = new Date();
  admin.lastLoginAt = new Date();
  await admin.save();
  challenge.consumedAt = new Date();
  await challenge.save();
  return { admin, recoveryCodes, tokens: await issueTokens(admin, requestMeta) };
}

async function verifyAdminMfa({ challengeToken, code, recoveryCode, requestMeta }) {
  const { challenge, adminId } = await loadChallenge(challengeToken, 'MFA_VERIFY');
  const admin = await AdminAccount.findById(adminId).select('+mfa.encryptedSecret +mfa.recoveryCodeHashes');
  if (!admin?.mfa?.enabled || !admin.mfa.encryptedSecret) throw new AppError(409, 'MFA_NOT_CONFIGURED', 'MFA is not configured for this account');
  let valid = false;
  if (code) valid = (await verifyTotp({ secret: decryptMfaSecret(admin.mfa.encryptedSecret), token: code })).valid;
  if (recoveryCode) {
    const recoveryHash = hashRecoveryCode(recoveryCode);
    const index = admin.mfa.recoveryCodeHashes?.indexOf(recoveryHash) ?? -1;
    if (index >= 0) { valid = true; admin.mfa.recoveryCodeHashes.splice(index, 1); }
  }
  if (!valid) return rejectMfaAttempt(challenge);
  admin.lastLoginAt = new Date();
  await admin.save();
  challenge.consumedAt = new Date();
  await challenge.save();
  return { admin, tokens: await issueTokens(admin, requestMeta) };
}

async function refreshAdminTokens(refreshToken, requestMeta) {
  let payload;
  try { payload = verifyAdminRefreshToken(refreshToken); } catch (_) { throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'The refresh token is invalid or expired'); }
  const session = await AdminSession.findById(payload.sid).select('+refreshTokenHash');
  if (!session || session.revokedAt || session.expiresAt <= new Date() || session.refreshTokenHash !== hashToken(refreshToken)) throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'The refresh token is invalid or expired');
  const admin = await AdminAccount.findById(payload.sub);
  if (!admin || admin.status !== 'ACTIVE' || !admin.mfa?.enabled) throw new AppError(401, 'ACCOUNT_UNAVAILABLE', 'The admin account is unavailable');
  return issueTokens(admin, requestMeta, session);
}

async function logoutAdmin(refreshToken) {
  try { const payload = verifyAdminRefreshToken(refreshToken); await AdminSession.findByIdAndUpdate(payload.sid, { revokedAt: new Date() }); } catch (_) { /* Idempotent. */ }
}

async function changeAdminPassword({ adminId, currentPassword, newPassword, currentSessionId }) {
  const admin = await AdminAccount.findById(adminId).select('+passwordHash');
  if (!admin || !(await bcrypt.compare(currentPassword, admin.passwordHash))) {
    throw new AppError(401, 'INVALID_CURRENT_PASSWORD', 'The current password is incorrect');
  }
  if (await bcrypt.compare(newPassword, admin.passwordHash)) {
    throw new AppError(422, 'PASSWORD_UNCHANGED', 'The new password must be different from the current password');
  }
  admin.passwordHash = await bcrypt.hash(newPassword, 12);
  admin.mustChangePassword = false;
  await admin.save();
  await AdminSession.updateMany(
    { adminId: admin.id, _id: { $ne: currentSessionId }, revokedAt: null },
    { revokedAt: new Date() },
  );
  return admin;
}

async function logoutAdminEverywhere(adminId) {
  await AdminSession.updateMany({ adminId, revokedAt: null }, { revokedAt: new Date() });
}

export { beginMfaSetup, changeAdminPassword, completeMfaSetup, loginAdmin, logoutAdmin, logoutAdminEverywhere, refreshAdminTokens, verifyAdminMfa };

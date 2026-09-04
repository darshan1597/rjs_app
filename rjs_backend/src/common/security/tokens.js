import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

function signAdminAccessToken(admin, sessionId) {
  return jwt.sign(
    { sub: admin.id, sid: sessionId, tokenType: 'access', actorType: 'admin' },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: env.ACCESS_TOKEN_TTL, issuer: 'rjs-backend', audience: 'rjs-admin' },
  );
}

function signAdminRefreshToken(adminId, sessionId) {
  return jwt.sign(
    { sub: adminId, sid: sessionId, tokenType: 'refresh', actorType: 'admin' },
    env.REFRESH_TOKEN_SECRET,
    { expiresIn: `${env.ADMIN_SESSION_TTL_HOURS}h`, issuer: 'rjs-backend', audience: 'rjs-admin' },
  );
}

function signMfaChallengeToken(adminId, challengeId, purpose) {
  return jwt.sign(
    { sub: adminId, cid: challengeId, tokenType: 'mfa_challenge', purpose, actorType: 'admin' },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: '5m', issuer: 'rjs-backend', audience: 'rjs-admin-mfa' },
  );
}

const verifyAdminAccessToken = (token) => jwt.verify(token, env.ACCESS_TOKEN_SECRET, { issuer: 'rjs-backend', audience: 'rjs-admin' });
const verifyAdminRefreshToken = (token) => jwt.verify(token, env.REFRESH_TOKEN_SECRET, { issuer: 'rjs-backend', audience: 'rjs-admin' });
const verifyMfaChallengeToken = (token) => jwt.verify(token, env.ACCESS_TOKEN_SECRET, { issuer: 'rjs-backend', audience: 'rjs-admin-mfa' });
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
function signCustomerAccessToken(customer, sessionId) { return jwt.sign({ sub: customer.id, sid: sessionId, tokenType: 'access', actorType: 'customer' }, env.ACCESS_TOKEN_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL, issuer: 'rjs-backend', audience: 'rjs-customer' }); }
function signCustomerRefreshToken(customerId, sessionId) { return jwt.sign({ sub: customerId, sid: sessionId, tokenType: 'refresh', actorType: 'customer' }, env.REFRESH_TOKEN_SECRET, { expiresIn: `${env.CUSTOMER_SESSION_TTL_DAYS}d`, issuer: 'rjs-backend', audience: 'rjs-customer' }); }
const verifyCustomerAccessToken = (token) => jwt.verify(token, env.ACCESS_TOKEN_SECRET, { issuer: 'rjs-backend', audience: 'rjs-customer' });
const verifyCustomerRefreshToken = (token) => jwt.verify(token, env.REFRESH_TOKEN_SECRET, { issuer: 'rjs-backend', audience: 'rjs-customer' });
function signDriverAccessToken(driver, sessionId) { return jwt.sign({ sub: driver.id, sid: sessionId, tokenType: 'access', actorType: 'driver' }, env.ACCESS_TOKEN_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL, issuer: 'rjs-backend', audience: 'rjs-driver' }); }
function signDriverRefreshToken(driverId, sessionId) { return jwt.sign({ sub: driverId, sid: sessionId, tokenType: 'refresh', actorType: 'driver' }, env.REFRESH_TOKEN_SECRET, { expiresIn: `${env.DRIVER_SESSION_TTL_DAYS}d`, issuer: 'rjs-backend', audience: 'rjs-driver' }); }
const verifyDriverAccessToken = (token) => jwt.verify(token, env.ACCESS_TOKEN_SECRET, { issuer: 'rjs-backend', audience: 'rjs-driver' });
const verifyDriverRefreshToken = (token) => jwt.verify(token, env.REFRESH_TOKEN_SECRET, { issuer: 'rjs-backend', audience: 'rjs-driver' });

export { hashToken, signAdminAccessToken, signAdminRefreshToken, signCustomerAccessToken, signCustomerRefreshToken, signDriverAccessToken, signDriverRefreshToken, signMfaChallengeToken, verifyAdminAccessToken, verifyAdminRefreshToken, verifyCustomerAccessToken, verifyCustomerRefreshToken, verifyDriverAccessToken, verifyDriverRefreshToken, verifyMfaChallengeToken };

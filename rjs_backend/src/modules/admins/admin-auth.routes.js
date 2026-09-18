import express from 'express';
import { createLimiter } from '../../common/middleware/rate-limits.js';
import { validate } from '../../common/middleware/validate.js';
import { changePassword, login, logout, logoutAll, me, refresh, setupMfa, verifyMfa, verifyMfaSetup } from './admin-auth.controller.js';
import { authenticateAdmin } from './admin-auth.middleware.js';
import { challengeSchema, changePasswordSchema, loginSchema, mfaVerificationSchema, refreshTokenSchema, setupVerificationSchema } from './admin-auth.schemas.js';

const adminAuthRouter = express.Router();

const loginLimiter = createLimiter({ windowMs: 10 * 60 * 1000, limit: 10 });

adminAuthRouter.post('/login', loginLimiter, validate(loginSchema), login);
adminAuthRouter.post('/mfa/setup', loginLimiter, validate(challengeSchema), setupMfa);
adminAuthRouter.post('/mfa/setup/verify', loginLimiter, validate(setupVerificationSchema), verifyMfaSetup);
adminAuthRouter.post('/mfa/verify', loginLimiter, validate(mfaVerificationSchema), verifyMfa);
adminAuthRouter.post('/refresh', validate(refreshTokenSchema), refresh);
adminAuthRouter.post('/logout', validate(refreshTokenSchema), logout);
adminAuthRouter.get('/me', authenticateAdmin, me);
adminAuthRouter.post('/change-password', authenticateAdmin, validate(changePasswordSchema), changePassword);
adminAuthRouter.post('/logout-all', authenticateAdmin, logoutAll);

export { adminAuthRouter };

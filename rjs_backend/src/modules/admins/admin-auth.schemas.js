import { z } from 'zod';

const empty = z.object({});
const loginSchema = z.object({ body: z.object({ email: z.string().email(), password: z.string().min(1) }), params: empty, query: empty });
const refreshTokenSchema = z.object({ body: z.object({ refreshToken: z.string().min(1) }), params: empty, query: empty });
const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(12).max(128),
  }).refine((value) => value.currentPassword !== value.newPassword, {
    message: 'The new password must be different from the current password',
    path: ['newPassword'],
  }),
  params: empty,
  query: empty,
});
const challengeSchema = z.object({ body: z.object({ challengeToken: z.string().min(1) }), params: empty, query: empty });
const setupVerificationSchema = z.object({ body: z.object({ challengeToken: z.string().min(1), code: z.string().regex(/^\d{6}$/) }), params: empty, query: empty });
const mfaVerificationSchema = z.object({
  body: z.object({ challengeToken: z.string().min(1), code: z.string().regex(/^\d{6}$/).optional(), recoveryCode: z.string().min(10).optional() }).refine((value) => Boolean(value.code) !== Boolean(value.recoveryCode), 'Provide either an authenticator code or a recovery code'),
  params: empty,
  query: empty,
});

export { challengeSchema, changePasswordSchema, loginSchema, mfaVerificationSchema, refreshTokenSchema, setupVerificationSchema };

import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URL: z.string().min(1, 'MONGODB_URL is required'),
  ACCESS_TOKEN_SECRET: z.string().min(32, 'ACCESS_TOKEN_SECRET must contain at least 32 characters'),
  REFRESH_TOKEN_SECRET: z.string().min(32, 'REFRESH_TOKEN_SECRET must contain at least 32 characters'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  ADMIN_SESSION_TTL_HOURS: z.coerce.number().int().positive().default(12),
  CUSTOMER_SESSION_TTL_DAYS: z.coerce.number().int().positive().default(90),
  DRIVER_SESSION_TTL_DAYS: z.coerce.number().int().positive().default(90),
  MFA_ENCRYPTION_KEY: z.string().refine((value) => {
    try { return Buffer.from(value, 'base64').length === 32; } catch (_) { return false; }
  }, 'MFA_ENCRYPTION_KEY must be exactly 32 random bytes encoded as base64'),
  DEV_FIXED_OTP: z.string().regex(/^\d{6}$/).default('123456'),
  CLIENT_ORIGINS: z.string().default('http://localhost:3000'),
  SUPER_ADMIN_NAME: z.string().min(2).optional(),
  SUPER_ADMIN_EMAIL: z.string().email().optional(),
  SUPER_ADMIN_PASSWORD: z.string().min(12).optional(),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  const details = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${details}`);
}

const env = {
  ...result.data,
  clientOrigins: result.data.CLIENT_ORIGINS.split(',').map((value) => value.trim()).filter(Boolean),
};

export { env };

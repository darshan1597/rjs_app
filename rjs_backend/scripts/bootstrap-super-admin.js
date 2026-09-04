import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { AdminAccount } from '../src/modules/admins/admin-account.model.js';
import { writeAuditLog } from '../src/modules/audit/audit.service.js';

async function bootstrap() {
  if (!env.SUPER_ADMIN_NAME || !env.SUPER_ADMIN_EMAIL || !env.SUPER_ADMIN_PASSWORD) throw new Error('SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, and SUPER_ADMIN_PASSWORD are required');
  await connectDatabase();
  const existing = await AdminAccount.findOne({ accountType: 'SUPER_ADMIN' });
  if (existing) {
    console.log(`Super Admin already exists for ${existing.email}; nothing changed`);
    return;
  }
  const admin = await AdminAccount.create({
    name: env.SUPER_ADMIN_NAME,
    email: env.SUPER_ADMIN_EMAIL.toLowerCase(),
    passwordHash: await bcrypt.hash(env.SUPER_ADMIN_PASSWORD, 12),
    accountType: 'SUPER_ADMIN',
    status: 'ACTIVE',
  });
  await writeAuditLog({ action: 'super_admin.bootstrap', actor: admin, targetType: 'AdminAccount', targetId: admin.id });
  console.log(`Super Admin created for ${admin.email}`);
}

bootstrap()
  .catch((error) => { console.error('Super Admin bootstrap failed:', error.message); process.exitCode = 1; })
  .finally(() => disconnectDatabase());

import { z } from 'zod';
const appControl = z.object({ status: z.enum(['ACTIVE', 'MAINTENANCE']), maintenanceMessage: z.string().trim().max(300), minimumVersion: z.string().trim().min(1).max(30), forceUpdate: z.boolean() });
const updateSystemSettingsSchema = z.object({
  body: z.object({
    company: z.object({ businessName: z.string().trim().min(2).max(120), supportEmail: z.string().email(), supportPhone: z.string().trim().min(7).max(20), headOfficeAddress: z.string().trim().min(5).max(300), logoUrl: z.union([z.string().url(), z.literal('')]) }),
    security: z.object({ employeeLoginBlocked: z.boolean() }), apps: z.object({ customer: appControl, driver: appControl }),
  }), params: z.object({}), query: z.object({}),
});
export { updateSystemSettingsSchema };

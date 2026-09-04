import { z } from 'zod';

const empty = z.object({});
const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const employeeParams = z.object({ employeeId: objectId });
const listEmployeesSchema = z.object({ body: z.unknown().optional(), params: z.object({}), query: z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().min(1).max(100).default(10), search: z.string().trim().max(100).optional(), status: z.enum(['ACTIVE', 'DISABLED']).optional() }) });
const createEmployeeSchema = z.object({ body: z.object({ name: z.string().min(2).max(100), email: z.string().email(), temporaryPassword: z.string().min(12) }), params: empty, query: empty });
const updateEmployeeSchema = z.object({ body: z.object({ name: z.string().min(2).max(100).optional(), status: z.enum(['ACTIVE', 'DISABLED']).optional() }).refine((value) => Object.keys(value).length > 0), params: employeeParams, query: empty });
const employeeActionSchema = z.object({ body: empty, params: employeeParams, query: empty });
export { createEmployeeSchema, employeeActionSchema, listEmployeesSchema, updateEmployeeSchema };

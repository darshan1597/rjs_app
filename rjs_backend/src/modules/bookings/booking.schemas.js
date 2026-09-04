import { z } from 'zod';
const empty = z.object({});
const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const listBookingsSchema = z.object({ body: z.unknown().optional(), params: empty, query: z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().min(1).max(100).default(10), search: z.string().trim().max(100).optional(), status: z.string().trim().optional(), serviceType: z.string().trim().optional(), paymentStatus: z.string().trim().optional() }) });
const bookingParams = z.object({ bookingId: objectId });
const assignDriverSchema = z.object({ body: z.object({ driverId: objectId, reason: z.string().trim().max(300).optional() }), params: bookingParams, query: empty });
const bookingActionSchema = z.object({ body: z.unknown().optional(), params: bookingParams, query: empty });
const bookingNoteSchema = z.object({ body: z.object({ text: z.string().trim().min(2).max(1000) }), params: bookingParams, query: empty });
export { assignDriverSchema, bookingActionSchema, bookingNoteSchema, listBookingsSchema };

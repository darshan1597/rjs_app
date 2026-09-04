import { z } from 'zod';

const empty = z.object({});
const auditListSchema = z.object({
  // GET requests do not have a body; Express leaves req.body undefined.
  body: z.unknown().optional(),
  params: empty,
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    action: z.string().trim().min(1).optional(),
    actorId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
    targetType: z.string().trim().min(1).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }).refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: 'The from date must be before the to date',
    path: ['from'],
  }),
});

export { auditListSchema };

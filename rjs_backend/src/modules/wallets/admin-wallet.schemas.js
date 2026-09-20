import { z } from 'zod';

const empty = z.object({});
const id = z.string().regex(/^[a-f\d]{24}$/i);
const pagination = {
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
};

const listAdminWalletsSchema = z.object({
  body: z.unknown().optional(),
  params: empty,
  query: z.object({ ...pagination, search: z.string().trim().max(100).optional() }),
});

const adminWalletDetailsSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({ customerId: id }),
  query: z.object({ limit: z.coerce.number().int().min(1).max(100).default(50) }),
});

const adjustmentRequestSchema = z.object({
  body: z.object({
    type: z.enum(['CREDIT', 'DEBIT']),
    amountPaise: z.number().int().min(100).max(1000000),
    reason: z.string().trim().min(10).max(500),
    idempotencyKey: z.string().regex(/^[a-zA-Z0-9_-]{16,100}$/),
  }),
  params: z.object({ customerId: id }),
  query: empty,
});

const listAdjustmentsSchema = z.object({
  body: z.unknown().optional(), params: empty,
  query: z.object({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(), limit: z.coerce.number().int().min(1).max(100).default(50) }),
});

const reviewAdjustmentSchema = z.object({
  body: z.object({ decision: z.enum(['APPROVED', 'REJECTED']), note: z.string().trim().min(3).max(500) }),
  params: z.object({ adjustmentId: id }), query: empty,
});

const listWithdrawalsSchema = z.object({
  body: z.unknown().optional(), params: empty,
  query: z.object({ status: z.enum(['PENDING', 'PROCESSING', 'PAID', 'REJECTED', 'FAILED', 'REVERSED']).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50) }),
});
const reviewWithdrawalSchema = z.object({
  body: z.object({ decision: z.enum(['APPROVED', 'REJECTED']), note: z.string().trim().min(3).max(500) }),
  params: z.object({ withdrawalId: id }), query: empty,
});

export { listAdminWalletsSchema, adminWalletDetailsSchema, adjustmentRequestSchema, listAdjustmentsSchema,
  reviewAdjustmentSchema, listWithdrawalsSchema, reviewWithdrawalSchema };

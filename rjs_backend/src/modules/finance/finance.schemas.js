import { z } from 'zod';

const financeOverviewSchema = z.object({
  body: z.unknown().optional(), params: z.object({}),
  query: z.object({ period: z.enum(['all', 'today', '30d', 'year']).default('all') }),
});

export { financeOverviewSchema };

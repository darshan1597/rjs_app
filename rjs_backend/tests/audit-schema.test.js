import { describe, expect, it } from 'vitest';
import { auditListSchema } from '../src/modules/audit/audit.schemas.js';

describe('audit log query validation', () => {
  it('accepts a body-less paginated GET request', () => {
    const result = auditListSchema.safeParse({
      body: undefined,
      params: {},
      query: { page: '1', limit: '50' },
    });
    expect(result.success).toBe(true);
    expect(result.data.query).toMatchObject({ page: 1, limit: 50 });
  });
});

import { beforeEach, expect, it, vi } from 'vitest';

import { Driver } from '../src/modules/drivers/driver.model.js';
import { reviewDriverChange } from '../src/modules/drivers/driver.service.js';
import { SupportTicket } from '../src/modules/support/support-ticket.model.js';

const request = (area = 'PERSONAL') => ({
  id: 'request-id',
  profileChangeArea: area,
  status: 'OPEN',
  messages: [],
  save: vi.fn().mockResolvedValue(undefined),
});

beforeEach(() => vi.restoreAllMocks());

it('applies only the approved section and records the review', async () => {
  const item = request();
  vi.spyOn(SupportTicket, 'findOne').mockResolvedValue(item);
  const update = vi.spyOn(Driver, 'findByIdAndUpdate').mockResolvedValue({ id: 'driver' });
  await reviewDriverChange('driver', 'request', {
    decision: 'APPROVED', note: 'Verified with the driver',
    updates: { personal: { email: 'new@example.com' }, bank: { upiId: 'ignored@upi' } },
  }, 'admin');
  expect(update).toHaveBeenCalledWith('driver', { $set: { 'personal.email': 'new@example.com' } }, { new: true, runValidators: true });
  expect(item.reviewDecision).toBe('APPROVED');
  expect(item.status).toBe('RESOLVED');
  expect(item.save).toHaveBeenCalled();
});

it('rejects without changing the driver record', async () => {
  const item = request('BANK');
  vi.spyOn(SupportTicket, 'findOne').mockResolvedValue(item);
  const update = vi.spyOn(Driver, 'findByIdAndUpdate');
  await reviewDriverChange('driver', 'request', {
    decision: 'REJECTED', note: 'Please provide a bank proof',
  }, 'admin');
  expect(update).not.toHaveBeenCalled();
  expect(item.reviewDecision).toBe('REJECTED');
  expect(item.status).toBe('CLOSED');
});

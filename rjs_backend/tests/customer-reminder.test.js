import { expect, it } from 'vitest';
import { customerReminderToCreate } from '../src/modules/customers/customer-reminder.service.js';

const base = {
  _id: 'booking', customerId: 'customer', bookingNumber: 'RJS12345678',
  timing: 'SCHEDULED', status: 'ASSIGNED',
};

it('creates deduplicated one-hour and fifteen-minute reminder payloads only when due', () => {
  const now = Date.UTC(2026, 8, 29, 6, 0);
  const booking = { ...base, scheduledStartAt: new Date(now + 60 * 60000) };
  const oneHour = customerReminderToCreate(booking, 'ONE_HOUR', now);
  expect(oneHour).toMatchObject({ kind: 'ONE_HOUR', customerId: 'customer' });
  expect(oneHour.key).toContain('ONE_HOUR');
  expect(customerReminderToCreate(booking, 'FIFTEEN_MINUTES', now)).toBeNull();
  const fifteen = customerReminderToCreate(
    { ...booking, scheduledStartAt: new Date(now + 15 * 60000) }, 'FIFTEEN_MINUTES', now,
  );
  expect(fifteen).toMatchObject({ kind: 'FIFTEEN_MINUTES' });
});

it('does not remind cancelled, immediate, or overdue rides', () => {
  const now = Date.now();
  expect(customerReminderToCreate({ ...base, status: 'CANCELLED', scheduledStartAt: new Date(now + 60000) }, 'ONE_HOUR', now)).toBeNull();
  expect(customerReminderToCreate({ ...base, timing: 'IMMEDIATE', scheduledStartAt: new Date(now + 60000) }, 'ONE_HOUR', now)).toBeNull();
  expect(customerReminderToCreate({ ...base, scheduledStartAt: new Date(now - 1) }, 'ONE_HOUR', now)).toBeNull();
});

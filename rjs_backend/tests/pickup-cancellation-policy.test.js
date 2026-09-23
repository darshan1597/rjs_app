import { test } from 'vitest';
import assert from 'node:assert/strict';

import { customerNoShowState, immediatePickupDueAt, pickupCancellationState } from '../src/modules/bookings/pickup-cancellation.policy.js';

const acceptedAt = new Date('2026-09-22T10:00:00Z');
const booking = (extra = {}) => ({
  status: 'DRIVER_ACCEPTED', timing: 'IMMEDIATE', currentDriverId: 'driver-1',
  statusHistory: [{ status: 'DRIVER_ACCEPTED', changedAt: acceptedAt }],
  ...extra,
});

test('immediate late pickup uses initial route ETA plus 15 minutes', () => {
  assert.equal(immediatePickupDueAt(acceptedAt, 20).toISOString(), '2026-09-22T10:35:00.000Z');
  assert.equal(pickupCancellationState(booking({ pickupDueAt: immediatePickupDueAt(acceptedAt, 20) }), Date.parse('2026-09-22T10:34:59Z')).canCancelLatePickup, false);
  assert.equal(pickupCancellationState(booking({ pickupDueAt: immediatePickupDueAt(acceptedAt, 20) }), Date.parse('2026-09-22T10:35:00Z')).canCancelLatePickup, true);
});

test('scheduled pickup is late at booked time, but never after arrival or trip start', () => {
  const scheduled = booking({ timing: 'SCHEDULED', status: 'ASSIGNED', scheduledStartAt: new Date('2026-09-22T11:00:00Z') });
  assert.equal(pickupCancellationState(scheduled, Date.parse('2026-09-22T10:59:59Z')).canCancelLatePickup, false);
  assert.equal(pickupCancellationState(scheduled, Date.parse('2026-09-22T11:00:00Z')).canCancelLatePickup, true);
  assert.equal(pickupCancellationState({ ...scheduled, status: 'ARRIVED' }, Date.parse('2026-09-22T11:30:00Z')).canCancelLatePickup, false);
  assert.equal(pickupCancellationState({ ...scheduled, status: 'IN_PROGRESS' }, Date.parse('2026-09-22T11:30:00Z')).canCancelLatePickup, false);
});

test('customer no-show is only available 10 minutes after verified arrival', () => {
  const arrived = booking({ status: 'ARRIVED', arrivedAt: new Date('2026-09-22T10:10:00Z') });
  assert.equal(customerNoShowState(arrived, Date.parse('2026-09-22T10:19:59Z')).canMarkCustomerNoShow, false);
  assert.equal(customerNoShowState(arrived, Date.parse('2026-09-22T10:20:00Z')).canMarkCustomerNoShow, true);
  assert.equal(customerNoShowState({ ...arrived, status: 'IN_PROGRESS' }, Date.parse('2026-09-22T10:30:00Z')).canMarkCustomerNoShow, false);
});

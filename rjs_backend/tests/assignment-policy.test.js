import { describe, expect, it } from 'vitest';
import { canAssignBooking } from '../src/modules/bookings/assignment-policy.js';

describe('driver assignment policy', () => {
  it.each(['NEW', 'PAYMENT_CONFIRMED', 'ASSIGNMENT_PENDING', 'ASSIGNED', 'DRIVER_ACCEPTED'])('allows assignment before travel: %s', (status) => {
    expect(canAssignBooking(status)).toBe(true);
  });

  it.each(['DRIVER_EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'PAYMENT_PENDING', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'NO_DRIVER_AVAILABLE', 'SEARCHING_DRIVER', 'UNKNOWN'])('blocks unsafe assignment: %s', (status) => {
    expect(canAssignBooking(status)).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';

import { generateBookingNumber, indiaDateStamp, isBookingNumberCollision } from '../src/modules/bookings/booking-number.js';

describe('booking numbers', () => {
  it('uses the India date and a public-safe random suffix', () => {
    const instant = new Date('2026-09-12T18:45:00.000Z');
    expect(indiaDateStamp(instant)).toBe('20260913');
    expect(generateBookingNumber(instant)).toMatch(/^RJS-20260913-[2-9A-HJ-NP-Z]{8}$/);
  });

  it('does not repeat numbers generated for simultaneous bookings', () => {
    const instant = new Date('2026-09-12T10:00:00.000Z');
    const numbers = Array.from({ length: 10000 }, () => generateBookingNumber(instant));
    expect(new Set(numbers)).toHaveLength(numbers.length);
  });

  it('only identifies booking-number duplicate key errors as retryable', () => {
    expect(isBookingNumberCollision({ code: 11000, keyPattern: { bookingNumber: 1 } })).toBe(true);
    expect(isBookingNumberCollision({ code: 11000, keyPattern: { transactionId: 1 } })).toBe(false);
    expect(isBookingNumberCollision({ code: 121 })).toBe(false);
  });
});

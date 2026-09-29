import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('../src/modules/bookings/booking.model.js', () => ({
  Booking: { findOne: vi.fn(), updateOne: vi.fn() },
}));

import { Booking } from '../src/modules/bookings/booking.model.js';
import { submitCustomerRating } from '../src/modules/customers/customer-rating.service.js';

beforeEach(() => vi.clearAllMocks());

it('stores one rating for a paid completed ride', async () => {
  Booking.findOne.mockResolvedValue({
    _id: 'booking', status: 'COMPLETED', paymentStatus: 'PAID', currentDriverId: 'driver',
  });
  Booking.updateOne.mockResolvedValue({ modifiedCount: 1 });
  const rating = await submitCustomerRating({
    customerId: 'customer', bookingId: 'booking', score: 5, review: 'Professional driver',
  });
  expect(rating).toMatchObject({ score: 5, review: 'Professional driver' });
  expect(Booking.updateOne).toHaveBeenCalledWith(
    { _id: 'booking', customerRating: { $exists: false } },
    { $set: { customerRating: expect.objectContaining({ score: 5 }) } },
  );
});

it('rejects duplicate and ineligible ratings', async () => {
  Booking.findOne.mockResolvedValueOnce({
    _id: 'booking', status: 'COMPLETED', paymentStatus: 'PAID', currentDriverId: 'driver',
    customerRating: { score: 4 },
  });
  await expect(submitCustomerRating({ customerId: 'customer', bookingId: 'booking', score: 5 }))
    .rejects.toMatchObject({ code: 'RATING_ALREADY_SUBMITTED' });
  Booking.findOne.mockResolvedValueOnce({
    _id: 'booking', status: 'IN_PROGRESS', paymentStatus: 'PENDING', currentDriverId: 'driver',
  });
  await expect(submitCustomerRating({ customerId: 'customer', bookingId: 'booking', score: 5 }))
    .rejects.toMatchObject({ code: 'RATING_NOT_AVAILABLE' });
});

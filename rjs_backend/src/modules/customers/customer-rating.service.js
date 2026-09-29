import { AppError } from '../../common/errors/app-error.js';
import { Booking } from '../bookings/booking.model.js';

export async function submitCustomerRating({ customerId, bookingId, score, review }) {
  const booking = await Booking.findOne({ _id: bookingId, customerId });
  if (!booking) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking was not found');
  if (booking.status !== 'COMPLETED' || booking.paymentStatus !== 'PAID' || !booking.currentDriverId) {
    throw new AppError(409, 'RATING_NOT_AVAILABLE', 'You can rate a driver only after a paid ride is completed');
  }
  if (booking.customerRating) {
    throw new AppError(409, 'RATING_ALREADY_SUBMITTED', 'This ride has already been rated');
  }
  const rating = {
    score,
    ...(review ? { review } : {}),
    submittedAt: new Date(),
  };
  const result = await Booking.updateOne(
    { _id: booking._id, customerRating: { $exists: false } },
    { $set: { customerRating: rating } },
  );
  if (!result.modifiedCount) {
    throw new AppError(409, 'RATING_ALREADY_SUBMITTED', 'This ride has already been rated');
  }
  return rating;
}

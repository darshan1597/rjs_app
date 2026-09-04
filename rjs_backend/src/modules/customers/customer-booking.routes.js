import express from 'express';
import { z } from 'zod';

import { validate } from '../../common/middleware/validate.js';
import { AppError } from '../../common/errors/app-error.js';
import { Booking } from '../bookings/booking.model.js';
import { Payment } from '../payments/payment.model.js';
import { env } from '../../config/env.js';
import { authenticateCustomer } from './customer-auth.middleware.js';

const router = express.Router();
const empty = z.object({});
const createSchema = z.object({
  body: z.object({
    pickupAddress: z.string().trim().min(3).max(300),
    destinationAddress: z.string().trim().min(3).max(300),
    vehicleVariant: z.enum([
      'AUTO',
      'HATCHBACK',
      'SEDAN',
      'SUV',
      'TEMPO_TRAVELLER',
    ]),
    paymentMethod: z.enum(['UPI', 'CARD', 'NET_BANKING', 'WALLET']).optional(),
  }),
  params: empty,
  query: empty,
});

const prices = {
  AUTO: 94,
  HATCHBACK: 182,
  SEDAN: 318,
  SUV: 368,
  TEMPO_TRAVELLER: 1250,
};
const id = z.string().regex(/^[a-f\d]{24}$/i);
const bookingIdSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({ bookingId: id }),
  query: empty,
});
const seats = {
  AUTO: 3,
  HATCHBACK: 4,
  SEDAN: 4,
  SUV: 6,
  TEMPO_TRAVELLER: 12,
};

const toCustomerBooking = (booking) => ({
  id: booking.id,
  bookingNumber: booking.bookingNumber,
  pickup: booking.pickup,
  destination: booking.destination,
  vehicleVariant: booking.requestedVehicleVariant,
  amount: booking.totalAmount,
  status: booking.status,
  paymentStatus: booking.paymentStatus,
  paymentMethod: booking.paymentMethod,
  createdAt: booking.createdAt,
  serviceType: booking.serviceType,
  timing: booking.timing,
  scheduledStartAt: booking.scheduledStartAt,
  scheduledEndAt: booking.scheduledEndAt,
  estimatedDistanceKm: booking.estimatedDistanceKm,
  durationMinutes: booking.durationMinutes,
  passengerCount: booking.passengerCount,
  packageName: booking.packageName,
  driver: booking.currentDriverId && typeof booking.currentDriverId === 'object' ? {
    id: booking.currentDriverId.id,
    name: booking.currentDriverId.personal?.fullName,
    phone: booking.currentDriverId.personal?.phone,
    profilePhoto: booking.currentDriverId.personal?.profilePhoto,
    vehicle: booking.currentDriverId.vehicle,
  } : undefined,
  ...booking.status === 'ARRIVED' && booking.tripStartOtp ? { tripStartOtp: booking.tripStartOtp } : {},
});

router.use(authenticateCustomer);

router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const { pickupAddress, destinationAddress, vehicleVariant, paymentMethod } =
      req.validated.body;
    const start = new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const requestedVehicleType = vehicleVariant === 'AUTO'
      ? 'AUTO'
      : vehicleVariant === 'TEMPO_TRAVELLER'
        ? 'TEMPO_TRAVELLER'
        : 'CAR';

    const booking = await Booking.create({
      customerId: req.customer.id,
      customer: { name: req.customer.name, phone: req.customer.phone },
      serviceType: 'IMMEDIATE_RIDE',
      timing: 'IMMEDIATE',
      pickup: { address: pickupAddress },
      destination: { address: destinationAddress },
      durationMinutes: 28,
      estimatedDistanceKm: 8.4,
      passengerCount: seats[vehicleVariant],
      requestedVehicleType,
      requestedVehicleVariant: vehicleVariant,
      scheduledStartAt: start,
      scheduledEndAt: end,
      paymentStatus: 'PENDING',
      paymentMethod,
      totalAmount: prices[vehicleVariant],
      status: 'SEARCHING_DRIVER',
      statusHistory: [
        { status: 'SEARCHING_DRIVER', note: 'Searching for a nearby driver' },
      ],
    });

    return res.status(201).json({
      success: true,
      data: { booking: toCustomerBooking(booking) },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const bookings = await Booking.find({ customerId: req.customer.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('currentDriverId', 'personal.fullName personal.phone personal.profilePhoto vehicle');
    return res.json({
      success: true,
      data: { bookings: bookings.map(toCustomerBooking) },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:bookingId', validate(bookingIdSchema), async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.validated.params.bookingId,
      customerId: req.customer.id,
    }).select('+tripStartOtp').populate('currentDriverId', 'personal.fullName personal.phone personal.profilePhoto vehicle');
    if (!booking) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking was not found');
    }
    return res.json({
      success: true,
      data: { booking: toCustomerBooking(booking) },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/:bookingId/confirm-test-payment', validate(bookingIdSchema), async (req, res, next) => {
  try {
    if (env.NODE_ENV === 'production') throw new AppError(404, 'NOT_FOUND', 'This route is unavailable');
    const booking = await Booking.findOneAndUpdate(
      { _id: req.validated.params.bookingId, customerId: req.customer.id, status: 'AWAITING_PAYMENT', paymentStatus: 'PENDING' },
      {
        $set: { status: 'PAYMENT_CONFIRMED', paymentStatus: 'PAID', paymentMethod: 'UPI' },
        $push: { statusHistory: { status: 'PAYMENT_CONFIRMED', note: 'Development test payment confirmed' } },
      },
      { new: true, runValidators: true },
    ).populate('currentDriverId', 'personal.fullName personal.phone personal.profilePhoto vehicle');
    if (!booking) throw new AppError(409, 'PAYMENT_NOT_AVAILABLE', 'This booking is not waiting for payment');
    await Payment.create({
      transactionId: `DEV-${booking.bookingNumber}`,
      bookingId: booking.id,
      customerName: booking.customer.name,
      customerPhone: booking.customer.phone,
      bookingType: booking.serviceType,
      method: 'UPI',
      methodDisplay: 'Development test payment',
      gatewayReference: `DEV-${Date.now()}`,
      amount: booking.totalAmount,
      status: 'PAID',
      paidAt: new Date(),
    });
    return res.json({ success: true, data: { booking: toCustomerBooking(booking) } });
  } catch (error) { return next(error); }
});

router.post(
  '/:bookingId/cancel',
  validate(bookingIdSchema),
  async (req, res, next) => {
    try {
      const booking = await Booking.findOneAndUpdate(
        {
          _id: req.validated.params.bookingId,
          customerId: req.customer.id,
          status: { $in: ['SEARCHING_DRIVER', 'DRIVER_ACCEPTED', 'AWAITING_PAYMENT'] },
        },
        {
          $set: { status: 'CANCELLED' },
          $push: {
            statusHistory: {
              status: 'CANCELLED',
              note: 'Cancelled by customer before payment',
            },
          },
        },
        { new: true, runValidators: true },
      );
      if (!booking) {
        throw new AppError(
          409,
          'BOOKING_CANNOT_BE_CANCELLED',
          'This booking can no longer be cancelled',
        );
      }
      return res.json({
        success: true,
        data: { booking: toCustomerBooking(booking) },
      });
    } catch (error) {
      return next(error);
    }
  },
);

export { router as customerBookingRouter };

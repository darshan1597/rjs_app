import express from 'express';
import { z } from 'zod';

import { validate } from '../../common/middleware/validate.js';
import { AppError } from '../../common/errors/app-error.js';
import { Booking } from '../bookings/booking.model.js';
import { Payment } from '../payments/payment.model.js';
import { env } from '../../config/env.js';
import { authenticateCustomer } from './customer-auth.middleware.js';
import { Driver } from '../drivers/driver.model.js';
import { VehicleCategory, VehicleVariant } from '../vehicles/vehicle.model.js';
import { calculateLocalFare, fareBandFor } from '../bookings/local-fare.service.js';
import { computeRoute } from '../maps/maps.service.js';

const router = express.Router();
const empty = z.object({});
const createSchema = z.object({
  body: z.object({
    pickupAddress: z.string().trim().min(3).max(300),
    destinationAddress: z.string().trim().min(3).max(300),
    pickupLatitude: z.number().min(-90).max(90),
    pickupLongitude: z.number().min(-180).max(180),
    destinationLatitude: z.number().min(-90).max(90),
    destinationLongitude: z.number().min(-180).max(180),
    categoryId: z.string().regex(/^[a-f\d]{24}$/i),
    variantId: z.string().regex(/^[a-f\d]{24}$/i),
    paymentMethod: z.enum(['UPI', 'CARD', 'NET_BANKING', 'WALLET']).optional(),
  }),
  params: empty,
  query: empty,
});

const id = z.string().regex(/^[a-f\d]{24}$/i);
const bookingIdSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({ bookingId: id }),
  query: empty,
});
const searchStatuses = ['SEARCHING_DRIVER'];

async function expireDriverSearches(filter = {}) {
  await Booking.updateMany(
    {
      ...filter,
      status: { $in: searchStatuses },
      assignmentDeadline: { $lte: new Date() },
      currentDriverId: null,
    },
    {
      $set: { status: 'NO_DRIVER_AVAILABLE' },
      $push: {
        statusHistory: {
          status: 'NO_DRIVER_AVAILABLE',
          note: 'No matching driver accepted within the search window',
        },
      },
    },
  );
}
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
  pricing: booking.pricingSnapshot,
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

const catalogSchema = z.object({
  body: z.unknown().optional(), params: empty,
  query: z.object({
    pickupLatitude: z.coerce.number().min(-90).max(90),
    pickupLongitude: z.coerce.number().min(-180).max(180),
    destinationLatitude: z.coerce.number().min(-90).max(90),
    destinationLongitude: z.coerce.number().min(-180).max(180),
  }),
});

router.get('/vehicle-catalog', validate(catalogSchema), async (req, res, next) => {
  try {
    const { pickupLatitude, pickupLongitude, destinationLatitude, destinationLongitude } = req.validated.query;
    const [categories, variants, availability, route] = await Promise.all([
      VehicleCategory.find({ isActive: true }).sort({ name: 1 }).lean(),
      VehicleVariant.find({ isActive: true, onRoadPrice: { $gt: 0 } }).sort({ name: 1 }).lean(),
      Driver.aggregate([
        { $match: { status: 'ACTIVE', operationalStatus: 'ONLINE', serviceAssignment: { $in: ['LOCAL', 'FLEXIBLE', null] }, 'vehicle.categoryId': { $exists: true }, 'vehicle.variantId': { $exists: true } } },
        { $group: { _id: { categoryId: '$vehicle.categoryId', variantId: '$vehicle.variantId' }, count: { $sum: 1 } } },
      ]),
      computeRoute({
        origin: { latitude: pickupLatitude, longitude: pickupLongitude },
        destination: { latitude: destinationLatitude, longitude: destinationLongitude },
      }),
    ]);
    const counts = new Map(availability.map((row) => [`${row._id.categoryId}:${row._id.variantId}`, row.count]));
    return res.json({ success: true, data: { categories: categories.map((category) => ({
      id: category._id, name: category.name, code: category.code, photoUrl: category.photoUrl,
      variants: variants.filter((variant) => String(variant.categoryId) === String(category._id)).map((variant) => ({
        id: variant._id, name: variant.name, code: variant.code, photoUrl: variant.photoUrl,
        onRoadPrice: variant.onRoadPrice,
        fareBand: fareBandFor(variant.onRoadPrice).code,
        availableDrivers: counts.get(`${category._id}:${variant._id}`) || 0,
        available: (counts.get(`${category._id}:${variant._id}`) || 0) > 0,
        temporaryAmount: calculateLocalFare({ onRoadPrice: variant.onRoadPrice, distanceKm: route.distanceKm }).totalFare,
        pricing: calculateLocalFare({ onRoadPrice: variant.onRoadPrice, distanceKm: route.distanceKm }),
        temporarySeats: seats[variant.code] || 4,
      })),
    })).filter((category) => category.variants.length > 0), route } });
  } catch (error) { return next(error); }
});

router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const { pickupAddress, destinationAddress, pickupLatitude, pickupLongitude,
      destinationLatitude, destinationLongitude, categoryId, variantId, paymentMethod } =
      req.validated.body;
    const [category, variant] = await Promise.all([
      VehicleCategory.findOne({ _id: categoryId, isActive: true }),
      VehicleVariant.findOne({ _id: variantId, categoryId, isActive: true, onRoadPrice: { $gt: 0 } }),
    ]);
    if (!category || !variant) throw new AppError(422, 'VEHICLE_UNAVAILABLE', 'This vehicle option is no longer available');
    const availableDriver = await Driver.exists({ status: 'ACTIVE', operationalStatus: 'ONLINE', serviceAssignment: { $in: ['LOCAL', 'FLEXIBLE', null] }, 'vehicle.categoryId': categoryId, 'vehicle.variantId': variantId });
    if (!availableDriver) throw new AppError(409, 'NO_DRIVER_AVAILABLE', `No ${variant.name} driver is currently available`);
    const route = await computeRoute({
      origin: { latitude: pickupLatitude, longitude: pickupLongitude },
      destination: { latitude: destinationLatitude, longitude: destinationLongitude },
    });
    const start = new Date();
    const end = new Date(start.getTime() + Math.max(route.durationMinutes, 15) * 60 * 1000);
    const estimatedDistanceKm = route.distanceKm;
    const pricingSnapshot = calculateLocalFare({
      onRoadPrice: variant.onRoadPrice,
      distanceKm: estimatedDistanceKm,
      bookedAt: start,
    });

    const booking = await Booking.create({
      customerId: req.customer.id,
      customer: { name: req.customer.name, phone: req.customer.phone },
      serviceType: 'IMMEDIATE_RIDE',
      timing: 'IMMEDIATE',
      pickup: { address: pickupAddress, latitude: pickupLatitude, longitude: pickupLongitude },
      destination: { address: destinationAddress, latitude: destinationLatitude, longitude: destinationLongitude },
      durationMinutes: route.durationMinutes,
      estimatedDistanceKm,
      passengerCount: seats[variant.code] || 4,
      requestedVehicleType: category.code,
      requestedVehicleVariant: variant.code,
      vehicleCategoryId: category.id,
      vehicleVariantId: variant.id,
      scheduledStartAt: start,
      scheduledEndAt: end,
      paymentStatus: 'PENDING',
      paymentMethod,
      totalAmount: pricingSnapshot.totalFare,
      pricingSnapshot,
      status: 'SEARCHING_DRIVER',
      assignmentDeadline: new Date(Date.now() + 45 * 1000),
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
    await expireDriverSearches({ customerId: req.customer.id });
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
    await expireDriverSearches({
      _id: req.validated.params.bookingId,
      customerId: req.customer.id,
    });
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

router.post('/:bookingId/retry-search', validate(bookingIdSchema), async (req, res, next) => {
  try {
    await expireDriverSearches({
      _id: req.validated.params.bookingId,
      customerId: req.customer.id,
    });
    const existing = await Booking.findOne({
      _id: req.validated.params.bookingId,
      customerId: req.customer.id,
      status: 'NO_DRIVER_AVAILABLE',
      currentDriverId: null,
    });
    if (!existing) {
      throw new AppError(409, 'SEARCH_CANNOT_BE_RETRIED', 'This ride is not ready to search again');
    }

    const [category, variant, availableDriver] = await Promise.all([
      VehicleCategory.findOne({ _id: existing.vehicleCategoryId, isActive: true }),
      VehicleVariant.findOne({
        _id: existing.vehicleVariantId,
        categoryId: existing.vehicleCategoryId,
        isActive: true,
        onRoadPrice: { $gt: 0 },
      }),
      Driver.exists({
        status: 'ACTIVE',
        operationalStatus: 'ONLINE',
        serviceAssignment: { $in: ['LOCAL', 'FLEXIBLE', null] },
        'vehicle.categoryId': existing.vehicleCategoryId,
        'vehicle.variantId': existing.vehicleVariantId,
      }),
    ]);
    if (!category || !variant) {
      throw new AppError(422, 'VEHICLE_UNAVAILABLE', 'This vehicle option is no longer available');
    }
    if (!availableDriver) {
      throw new AppError(409, 'NO_DRIVER_AVAILABLE', `No ${variant.name} driver is currently available`);
    }

    existing.status = 'SEARCHING_DRIVER';
    existing.assignmentDeadline = new Date(Date.now() + 45 * 1000);
    existing.rejectedDriverIds = [];
    existing.statusHistory.push({
      status: 'SEARCHING_DRIVER',
      note: 'Customer started another driver search',
    });
    await existing.save();
    return res.json({ success: true, data: { booking: toCustomerBooking(existing) } });
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
          status: { $in: ['SEARCHING_DRIVER', 'DRIVER_ACCEPTED', 'AWAITING_PAYMENT', 'NO_DRIVER_AVAILABLE'] },
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

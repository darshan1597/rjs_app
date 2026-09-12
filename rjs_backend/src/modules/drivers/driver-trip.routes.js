import express from 'express';
import { z } from 'zod';

import { AppError } from '../../common/errors/app-error.js';
import { validate } from '../../common/middleware/validate.js';
import { Booking } from '../bookings/booking.model.js';
import { VehicleVariant } from '../vehicles/vehicle.model.js';
import { calculateLocalFare } from '../bookings/local-fare.service.js';
import { createQrCode } from '../payments/razorpay.service.js';
import { authenticateDriver } from './driver-auth.middleware.js';

const router = express.Router();
const vehicleMatch = (driver) => driver.vehicle.categoryId && driver.vehicle.variantId
  ? { vehicleCategoryId: driver.vehicle.categoryId, vehicleVariantId: driver.vehicle.variantId, serviceType: 'IMMEDIATE_RIDE' }
  : { requestedVehicleType: driver.vehicle.category, serviceType: 'IMMEDIATE_RIDE' };
const empty = z.object({});
const id = z.string().regex(/^[a-f\d]{24}$/i);
const idSchema = z.object({ body: empty, params: z.object({ bookingId: id }), query: empty });
const startSchema = z.object({ body: z.object({ otp: z.string().regex(/^\d{6}$/) }), params: z.object({ bookingId: id }), query: empty });
const arriveSchema = z.object({
  body: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  params: z.object({ bookingId: id }),
  query: empty,
});
const completeSchema = z.object({
  body: z.object({
    parkingCharge: z.coerce.number().min(0).max(100000).default(0),
    tollCharge: z.coerce.number().min(0).max(100000).default(0),
  }),
  params: z.object({ bookingId: id }),
  query: empty,
});
const radians = (degrees) => degrees * Math.PI / 180;
function distanceMetres(first, second) {
  const latitudeDelta = radians(second.latitude - first.latitude);
  const longitudeDelta = radians(second.longitude - first.longitude);
  const firstLatitude = radians(first.latitude);
  const secondLatitude = radians(second.latitude);
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
const availabilitySchema = z.object({
  body: z.object({ status: z.enum(['ONLINE', 'OFFLINE']) }),
  params: empty,
  query: empty,
});

const toOffer = (booking) => ({
  id: booking.id,
  bookingNumber: booking.bookingNumber,
  pickup: booking.pickup,
  estimatedDistanceKm: booking.estimatedDistanceKm,
  durationMinutes: booking.durationMinutes,
  passengerCount: booking.passengerCount,
  vehicleVariant: booking.requestedVehicleVariant,
  status: booking.status,
  createdAt: booking.createdAt,
});

const toActiveTrip = (booking) => ({
  id: booking.id,
  bookingNumber: booking.bookingNumber,
  pickup: booking.pickup,
  ...['IN_PROGRESS', 'PAYMENT_PENDING', 'COMPLETED'].includes(booking.status) ? { destination: booking.destination } : {},
  estimatedDistanceKm: booking.estimatedDistanceKm,
  durationMinutes: booking.durationMinutes,
  passengerCount: booking.passengerCount,
  vehicleVariant: booking.requestedVehicleVariant,
  status: booking.status,
  customer: booking.customer,
  scheduledStartAt: booking.scheduledStartAt,
  ...['PAYMENT_PENDING', 'COMPLETED'].includes(booking.status) ? {
    amount: booking.totalAmount,
    pricing: booking.pricingSnapshot,
    paymentStatus: booking.paymentStatus,
    qrImageUrl: booking.razorpayQrImageUrl,
  } : {},
});

router.use(authenticateDriver);

router.patch('/availability', validate(availabilitySchema), async (req, res, next) => {
  try {
    if (req.driver.operationalStatus === 'ON_TRIP') {
      throw new AppError(409, 'DRIVER_ON_TRIP', 'Availability cannot be changed during a trip');
    }
    req.driver.operationalStatus = req.validated.body.status;
    await req.driver.save();
    return res.json({ success: true, data: { operationalStatus: req.driver.operationalStatus } });
  } catch (error) { return next(error); }
});

router.get('/offers', async (req, res, next) => {
  try {
    if (req.driver.operationalStatus !== 'ONLINE') {
      return res.json({ success: true, data: { offers: [] } });
    }
    if (!['LOCAL', 'FLEXIBLE'].includes(req.driver.serviceAssignment)) {
      return res.json({ success: true, data: { offers: [] } });
    }
    const now = new Date();
    await Booking.updateMany(
      {
        status: 'SEARCHING_DRIVER',
        assignmentDeadline: { $lte: now },
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
    const bookings = await Booking.find({
      status: 'SEARCHING_DRIVER',
      assignmentDeadline: { $gt: now },
      ...vehicleMatch(req.driver),
      currentDriverId: null,
      rejectedDriverIds: { $ne: req.driver._id },
    }).sort({ createdAt: 1 }).limit(10);
    return res.json({ success: true, data: { offers: bookings.map(toOffer) } });
  } catch (error) { return next(error); }
});

router.get('/active', async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      currentDriverId: req.driver._id,
      status: { $in: ['DRIVER_ACCEPTED', 'DRIVER_EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'PAYMENT_PENDING'] },
    }).sort({ updatedAt: -1 });
    return res.json({ success: true, data: { trip: booking ? toActiveTrip(booking) : null } });
  } catch (error) { return next(error); }
});

router.post('/:bookingId/accept', validate(idSchema), async (req, res, next) => {
  try {
    if (req.driver.operationalStatus !== 'ONLINE') throw new AppError(409, 'DRIVER_OFFLINE', 'Go online before accepting rides');
    if (!['LOCAL', 'FLEXIBLE'].includes(req.driver.serviceAssignment)) throw new AppError(403, 'DRIVER_NOT_ELIGIBLE', 'This driver is not assigned to local rides');
    const booking = await Booking.findOneAndUpdate(
      {
        _id: req.validated.params.bookingId,
        status: 'SEARCHING_DRIVER',
        assignmentDeadline: { $gt: new Date() },
        ...vehicleMatch(req.driver),
        currentDriverId: null,
        rejectedDriverIds: { $ne: req.driver._id },
      },
      {
        $set: { currentDriverId: req.driver._id, status: 'DRIVER_ACCEPTED' },
        $push: {
          assignments: {
            driverId: req.driver._id,
            vehicleRegistrationNumber: req.driver.vehicle.registrationNumber,
            method: 'AUTOMATIC',
          },
          statusHistory: { status: 'DRIVER_ACCEPTED', note: 'Driver accepted the ride' },
        },
      },
      { new: true, runValidators: true },
    );
    if (!booking) throw new AppError(409, 'RIDE_ALREADY_TAKEN', 'Another driver accepted this ride');
    return res.json({ success: true, data: { booking: toOffer(booking) } });
  } catch (error) { return next(error); }
});

router.post('/:bookingId/reject', validate(idSchema), async (req, res, next) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.validated.params.bookingId, status: 'SEARCHING_DRIVER', currentDriverId: null },
      { $addToSet: { rejectedDriverIds: req.driver._id } },
      { new: true },
    );
    if (!booking) throw new AppError(409, 'RIDE_UNAVAILABLE', 'This ride is no longer available');
    return res.json({ success: true, data: { rejected: true } });
  } catch (error) { return next(error); }
});

async function transition(req, res, next, from, to, extra = {}) {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.validated.params.bookingId, currentDriverId: req.driver._id, status: { $in: Array.isArray(from) ? from : [from] } },
      { $set: { status: to, ...extra }, $push: { statusHistory: { status: to, note: `Driver changed trip status to ${to}` } } },
      { new: true, runValidators: true },
    );
    if (!booking) throw new AppError(409, 'INVALID_TRIP_TRANSITION', 'The trip has already changed. Refresh and try again');
    if (['DRIVER_EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(to)) {
      req.driver.operationalStatus = 'ON_TRIP';
      await req.driver.save();
    }
    if (to === 'COMPLETED') {
      req.driver.operationalStatus = 'ONLINE';
      await req.driver.save();
    }
    return res.json({ success: true, data: { trip: toActiveTrip(booking) } });
  } catch (error) { return next(error); }
}

router.post('/:bookingId/en-route', validate(idSchema), (req, res, next) => transition(req, res, next, 'DRIVER_ACCEPTED', 'DRIVER_EN_ROUTE'));

router.post('/:bookingId/arrive', validate(arriveSchema), async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.validated.params.bookingId,
      currentDriverId: req.driver._id,
      status: 'DRIVER_EN_ROUTE',
    });
    if (!booking) throw new AppError(409, 'INVALID_TRIP_TRANSITION', 'This trip is not ready for arrival');
    if (!Number.isFinite(booking.pickup.latitude) || !Number.isFinite(booking.pickup.longitude)) {
      throw new AppError(422, 'PICKUP_LOCATION_UNAVAILABLE', 'Pickup coordinates are unavailable');
    }
    const distance = distanceMetres(req.validated.body, booking.pickup);
    if (distance > 200) {
      throw new AppError(409, 'TOO_FAR_FROM_PICKUP', `Move within 200 m of pickup before marking arrived (${Math.round(distance)} m away)`);
    }
    booking.status = 'ARRIVED';
    booking.arrivedAt = new Date();
    booking.tripStartOtp = String(Math.floor(100000 + Math.random() * 900000));
    booking.statusHistory.push({ status: 'ARRIVED', note: `Driver arrived ${Math.round(distance)} m from pickup; waiting timer started` });
    await booking.save();
    return res.json({ success: true, data: { trip: toActiveTrip(booking) } });
  } catch (error) { return next(error); }
});

router.post('/:bookingId/start', validate(startSchema), async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.validated.params.bookingId, currentDriverId: req.driver._id, status: 'ARRIVED' }).select('+tripStartOtp');
    if (!booking) throw new AppError(409, 'INVALID_TRIP_TRANSITION', 'This trip is not ready to start');

    if (booking.tripStartOtp !== req.validated.body.otp) throw new AppError(400, 'INVALID_TRIP_OTP', 'The trip OTP is incorrect');

    booking.status = 'IN_PROGRESS';
    booking.startedAt = new Date();
    booking.tripStartOtp = undefined;
    booking.statusHistory.push({ status: 'IN_PROGRESS', note: 'Trip started after OTP verification' });

    await booking.save();
    return res.json({ success: true, data: { trip: toActiveTrip(booking) } });
  } catch (error) { return next(error); }
});

router.post('/:bookingId/complete', validate(completeSchema), async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.validated.params.bookingId,
      currentDriverId: req.driver._id,
      status: 'IN_PROGRESS',
    });

    if (!booking) throw new AppError(409, 'INVALID_TRIP_TRANSITION', 'This trip is not ready to complete');
    const variant = await VehicleVariant.findById(booking.vehicleVariantId);

    if (!variant) throw new AppError(422, 'VEHICLE_UNAVAILABLE', 'The assigned vehicle pricing is unavailable');
    
    if (!booking.arrivedAt || !booking.startedAt) {
      throw new AppError(409, 'WAITING_TIME_UNAVAILABLE', 'Trip arrival or start time is missing');
    }
    
    const pickupWaitingMinutes = Math.max(
      0,
      (booking.startedAt.getTime() - booking.arrivedAt.getTime()) / 60000,
    );

    booking.pricingSnapshot = calculateLocalFare({
      onRoadPrice: variant.onRoadPrice,
      distanceKm: booking.estimatedDistanceKm,
      waitingMinutes: pickupWaitingMinutes,
      parkingCharge: req.validated.body.parkingCharge,
      tollCharge: req.validated.body.tollCharge,
      bookedAt: booking.createdAt,
    });

    booking.totalAmount = booking.pricingSnapshot.totalFare;
    booking.status = 'PAYMENT_PENDING';
    booking.completedAt = new Date();
    booking.statusHistory.push({ status: 'PAYMENT_PENDING', note: 'Trip ended; final bill generated' });

    try {
      const qr = await createQrCode(booking);
      booking.razorpayQrCodeId = qr.id;
      booking.razorpayQrImageUrl = qr.image_url;
    } catch (error) {
      req.log?.warn({ error: error.message }, 'Unable to create Razorpay QR; checkout remains available');
    }
    await booking.save();
    return res.json({ success: true, data: { trip: toActiveTrip(booking) } });
  } catch (error) { 
    return next(error); 
  }
});

export { router as driverTripRouter };

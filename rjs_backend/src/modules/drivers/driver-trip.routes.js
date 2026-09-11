import express from 'express';
import { z } from 'zod';

import { AppError } from '../../common/errors/app-error.js';
import { validate } from '../../common/middleware/validate.js';
import { Booking } from '../bookings/booking.model.js';
import { authenticateDriver } from './driver-auth.middleware.js';

const router = express.Router();
const vehicleMatch = (driver) => driver.vehicle.categoryId && driver.vehicle.variantId
  ? { vehicleCategoryId: driver.vehicle.categoryId, vehicleVariantId: driver.vehicle.variantId, serviceType: 'IMMEDIATE_RIDE' }
  : { requestedVehicleType: driver.vehicle.category, serviceType: 'IMMEDIATE_RIDE' };
const empty = z.object({});
const id = z.string().regex(/^[a-f\d]{24}$/i);
const idSchema = z.object({ body: empty, params: z.object({ bookingId: id }), query: empty });
const startSchema = z.object({ body: z.object({ otp: z.string().regex(/^\d{6}$/) }), params: z.object({ bookingId: id }), query: empty });
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
  ...['IN_PROGRESS', 'COMPLETED'].includes(booking.status) ? { destination: booking.destination } : {},
  estimatedDistanceKm: booking.estimatedDistanceKm,
  durationMinutes: booking.durationMinutes,
  passengerCount: booking.passengerCount,
  vehicleVariant: booking.requestedVehicleVariant,
  status: booking.status,
  customer: booking.customer,
  scheduledStartAt: booking.scheduledStartAt,
  ...booking.status === 'COMPLETED' ? { amount: booking.totalAmount } : {},
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
      status: { $in: ['AWAITING_PAYMENT', 'PAYMENT_CONFIRMED', 'DRIVER_EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'] },
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
        $set: { currentDriverId: req.driver._id, status: 'AWAITING_PAYMENT' },
        $push: {
          assignments: {
            driverId: req.driver._id,
            vehicleRegistrationNumber: req.driver.vehicle.registrationNumber,
            method: 'AUTOMATIC',
          },
          statusHistory: { status: 'AWAITING_PAYMENT', note: 'Driver accepted; waiting for customer payment' },
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

router.post('/:bookingId/en-route', validate(idSchema), (req, res, next) => transition(req, res, next, 'PAYMENT_CONFIRMED', 'DRIVER_EN_ROUTE'));
router.post('/:bookingId/arrive', validate(idSchema), (req, res, next) => transition(req, res, next, 'DRIVER_EN_ROUTE', 'ARRIVED', { arrivedAt: new Date(), tripStartOtp: String(Math.floor(100000 + Math.random() * 900000)) }));
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
router.post('/:bookingId/complete', validate(idSchema), (req, res, next) => transition(req, res, next, 'IN_PROGRESS', 'COMPLETED', { completedAt: new Date() }));

export { router as driverTripRouter };

import express from 'express';
import { z } from 'zod';

import { AppError } from '../../common/errors/app-error.js';
import { validate } from '../../common/middleware/validate.js';
import { Booking } from '../bookings/booking.model.js';
import { VehicleVariant } from '../vehicles/vehicle.model.js';
import { calculateLocalFare } from '../bookings/local-fare.service.js';
import { createQrCode } from '../payments/razorpay.service.js';
import { authenticateDriver } from './driver-auth.middleware.js';
import { scheduledPickupState } from '../bookings/scheduled-pickup-policy.js';
import { preparePickup, pickupPreparationState } from '../bookings/pickup-preparation.service.js';

const router = express.Router();
const vehicleMatch = (driver) => driver.vehicle.categoryId && driver.vehicle.variantId
  ? { vehicleCategoryId: driver.vehicle.categoryId, vehicleVariantId: driver.vehicle.variantId, serviceType: 'IMMEDIATE_RIDE' }
  : { requestedVehicleType: driver.vehicle.category, serviceType: 'IMMEDIATE_RIDE' };
const empty = z.object({});
const id = z.string().regex(/^[a-f\d]{24}$/i);
const idSchema = z.object({ body: empty, params: z.object({ bookingId: id }), query: empty });
const pickupLocation = z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), recordedAt: z.coerce.date() });
const previewSchema = z.object({ body: pickupLocation, params: z.object({ bookingId: id }), query: empty });
const enRouteSchema = z.object({ body: pickupLocation.partial(), params: z.object({ bookingId: id }), query: empty });
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
const locationSchema = z.object({
  body: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracyMetres: z.number().min(0).max(5000),
    heading: z.number().min(0).max(360).default(0),
    speedMetresPerSecond: z.number().min(0).max(150).default(0),
    recordedAt: z.coerce.date(),
  }),
  params: empty,
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
  timing: booking.timing,
  ...pickupPreparationState(booking, booking.currentDriverId),
  ...['PAYMENT_PENDING', 'COMPLETED'].includes(booking.status) ? {
    amount: booking.totalAmount,
    pricing: booking.pricingSnapshot,
    paymentStatus: booking.paymentStatus,
    qrImageUrl: booking.razorpayQrImageUrl,
  } : {},
});

router.use(authenticateDriver);

router.post('/:bookingId/pickup-preview', validate(previewSchema), async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.validated.params.bookingId, currentDriverId: req.driver._id, status: { $in: ['ASSIGNED', 'DRIVER_ACCEPTED', 'DRIVER_EN_ROUTE'] } });
    if (!booking) throw new AppError(409, 'PICKUP_PREVIEW_UNAVAILABLE', 'This ride is not available for pickup preview');
    const preparation = await preparePickup(booking, req.driver, req.validated.body);
    const state = scheduledPickupState(booking, Date.now(), preparation.route.durationMinutes);
    return res.json({ success: true, data: { trip: { ...toActiveTrip(booking), ...state }, preparation, onlineRequired: req.driver.operationalStatus === 'OFFLINE' } });
  } catch (error) { return next(error); }
});

// Retry QR creation without recalculating or changing the frozen final bill.
const qrRequests = new Map();
router.post('/:bookingId/payment-qr', validate(idSchema), async (req, res, next) => {
  try {
    const booking = await Booking.findOneAndUpdate({ _id: req.validated.params.bookingId, currentDriverId: req.driver._id, status: 'PAYMENT_PENDING', paymentStatus: 'PENDING', paymentChannel: { $ne: 'WALLET' } }, { $set: { paymentChannel: 'RAZORPAY' } }, { new: true });
    if (!booking) throw new AppError(409, 'PAYMENT_NOT_PENDING', 'This ride is not awaiting payment');
    if (!booking.razorpayQrImageUrl) {
      let pending = qrRequests.get(booking.id);
      if (!pending) {
        pending = (async () => {
          const qr = await createQrCode(booking);
          await Booking.updateOne({ _id: booking._id, status: 'PAYMENT_PENDING', paymentStatus: 'PENDING' }, { $set: { razorpayQrCodeId: qr.id, razorpayQrImageUrl: qr.image_url } });
        })();
        qrRequests.set(booking.id, pending);
      }
      try { await pending; } finally { if (qrRequests.get(booking.id) === pending) qrRequests.delete(booking.id); }
    }
    const refreshed = await Booking.findById(booking._id);
    return res.json({ success: true, data: { trip: toActiveTrip(refreshed) } });
  } catch (error) { return next(error); }
});

router.get('/scheduled', async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      currentDriverId: req.driver._id,
      timing: 'SCHEDULED',
      status: { $in: ['ASSIGNED', 'DRIVER_ACCEPTED', 'DRIVER_EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'PAYMENT_PENDING'] },
    }).sort({ scheduledStartAt: 1, _id: 1 });
    return res.json({ success: true, data: { trips: bookings.map((booking) => ({
      ...toActiveTrip(booking),
      serviceType: booking.serviceType,
    })) } });
  } catch (error) { return next(error); }
});

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

router.patch('/location', validate(locationSchema), async (req, res, next) => {
  try {
    if (!['ONLINE', 'ON_TRIP'].includes(req.driver.operationalStatus)) {
      throw new AppError(409, 'DRIVER_OFFLINE', 'Go online before sharing location');
    }
    const recordedAt = req.validated.body.recordedAt;
    if (Math.abs(Date.now() - recordedAt.getTime()) > 2 * 60 * 1000) {
      throw new AppError(400, 'STALE_LOCATION', 'Location reading is too old');
    }
    req.driver.currentLocation = { ...req.validated.body, recordedAt };
    await req.driver.save();
    return res.json({ success: true, data: { location: req.driver.currentLocation } });
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
    const currentRide = await Booking.findOne({
      currentDriverId: req.driver._id,
      status: { $in: ['DRIVER_EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'PAYMENT_PENDING'] },
    }).sort({ startedAt: 1, updatedAt: 1, _id: 1 });
    const booking = currentRide ?? await Booking.findOne({
      currentDriverId: req.driver._id,
      $or: [
        { status: 'DRIVER_ACCEPTED', timing: { $ne: 'SCHEDULED' } },
      ],
    }).sort({ scheduledStartAt: 1, _id: 1 });
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

router.post('/:bookingId/en-route', validate(enRouteSchema), async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.validated.params.bookingId,
      currentDriverId: req.driver._id,
      status: { $in: ['DRIVER_ACCEPTED', 'ASSIGNED'] },
    });
    if (!booking) throw new AppError(409, 'INVALID_TRIP_TRANSITION', 'This trip is not ready to begin');
    const busyTrip = await Booking.exists({
      _id: { $ne: booking._id }, currentDriverId: req.driver._id,
      status: { $in: ['DRIVER_EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'PAYMENT_PENDING'] },
    });
    if (busyTrip) throw new AppError(409, 'DRIVER_ON_TRIP', 'Finish your current ride and payment before starting another pickup');
    if (booking.timing === 'SCHEDULED') {
      if (scheduledPickupState(booking).pickupOverdue) throw new AppError(409, 'SCHEDULED_PICKUP_OVERDUE', 'Pickup time has passed. Contact RJS admin to resolve this booking');
      if (req.driver.operationalStatus === 'OFFLINE') throw new AppError(409, 'DRIVER_OFFLINE', 'Go online before starting pickup');
      const preparation = await preparePickup(booking, req.driver, req.validated.body, { force: true });
      const window = scheduledPickupState(booking, Date.now(), preparation.route.durationMinutes);
      if (window.pickupOverdue) throw new AppError(409, 'SCHEDULED_PICKUP_OVERDUE', 'Pickup time has passed. Contact RJS admin');
      if (!window.canStartPickup) throw new AppError(409, 'SCHEDULED_RIDE_TOO_EARLY', `Start to Pickup opens at ${window.recommendedDepartureAt.toISOString()} (ETA plus 15-minute buffer)`);
    }
    return transition(req, res, next, ['DRIVER_ACCEPTED', 'ASSIGNED'], 'DRIVER_EN_ROUTE');
  } catch (error) { return next(error); }
});

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

    // Generate QR only on request, so the customer can choose wallet first.
    await booking.save();
    return res.json({ success: true, data: { trip: toActiveTrip(booking) } });
  } catch (error) { 
    return next(error); 
  }
});

export { router as driverTripRouter };

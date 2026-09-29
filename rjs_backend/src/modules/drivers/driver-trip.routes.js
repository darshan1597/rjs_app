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
import { preparePickup, pickupPreparationState, preparationIsFresh } from '../bookings/pickup-preparation.service.js';
import { customerNoShowState, immediatePickupDueAt } from '../bookings/pickup-cancellation.policy.js';
import { releaseDriverAfterPickupEnds } from '../bookings/release-driver.service.js';
import { computeRoute } from '../maps/maps.service.js';
import { DriverPayout } from '../payments/payment.model.js';
import { sendCustomerBookingPush } from '../customers/customer-push.service.js';

const router = express.Router();
const vehicleMatch = (driver) => driver.vehicle.categoryId && driver.vehicle.variantId
  ? { vehicleCategoryId: driver.vehicle.categoryId, vehicleVariantId: driver.vehicle.variantId, serviceType: 'IMMEDIATE_RIDE' }
  : { requestedVehicleType: driver.vehicle.category, serviceType: 'IMMEDIATE_RIDE' };
const empty = z.object({});
const id = z.string().regex(/^[a-f\d]{24}$/i);
const idSchema = z.object({ body: empty, params: z.object({ bookingId: id }), query: empty });
const historySchema = z.object({
  body: empty.optional(),
  params: empty,
  query: z.object({ status: z.enum(['ALL', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).default('ALL') }),
});
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
  ...customerNoShowState(booking),
  ...['PAYMENT_PENDING', 'COMPLETED'].includes(booking.status) ? {
    amount: booking.totalAmount,
    pricing: booking.pricingSnapshot,
    paymentStatus: booking.paymentStatus,
    qrImageUrl: booking.razorpayQrImageUrl,
  } : {},
});

router.use(authenticateDriver);

function indiaDayBounds(now = Date.now()) {
  const offsetMs = 330 * 60000;
  const india = new Date(now + offsetMs);
  const start = Date.UTC(india.getUTCFullYear(), india.getUTCMonth(), india.getUTCDate()) - offsetMs;
  return { start: new Date(start), end: new Date(start + 86400000) };
}

function earningBuckets(period, now = Date.now()) {
  const offsetMs = 330 * 60000;
  const india = new Date(now + offsetMs);
  const year = india.getUTCFullYear();
  const month = india.getUTCMonth();
  const day = india.getUTCDate();
  const dayStart = Date.UTC(year, month, day) - offsetMs;
  let currentStart;
  let next;
  if (period === 'WEEKLY') {
    const weekday = (india.getUTCDay() + 6) % 7;
    currentStart = dayStart - weekday * 86400000;
    next = (start, step) => start + step * 7 * 86400000;
  } else if (period === 'MONTHLY') {
    currentStart = Date.UTC(year, month, 1) - offsetMs;
    next = (start, step) => {
      const local = new Date(start + offsetMs);
      return Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + step, 1) - offsetMs;
    };
  } else {
    currentStart = dayStart;
    next = (start, step) => start + step * 86400000;
  }
  const starts = Array.from({ length: 7 }, (_, index) => next(currentStart, index - 6));
  return starts.map((start, index) => {
    const local = new Date(start + offsetMs);
    const label = period === 'DAILY'
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][local.getUTCDay()]
      : period === 'WEEKLY'
      ? `${local.getUTCDate()}/${local.getUTCMonth() + 1}`
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][local.getUTCMonth()];
    return { index, start: new Date(start), end: new Date(next(start, 1)), label };
  });
}

const money = (value) => Math.round(Number(value || 0) * 100) / 100;

router.get('/dashboard', async (req, res, next) => {
  try {
    const now = new Date();
    const { start, end } = indiaDayBounds(now.getTime());
    const upcomingFilter = {
      currentDriverId: req.driver._id,
      timing: 'SCHEDULED',
      status: { $in: ['ASSIGNED', 'DRIVER_ACCEPTED'] },
      scheduledStartAt: { $gt: now },
    };
    const [todayRows, upcomingCount, nextTrip] = await Promise.all([
      Booking.aggregate([
        { $match: {
          currentDriverId: req.driver._id,
          status: { $in: ['PAYMENT_PENDING', 'COMPLETED'] },
          completedAt: { $gte: start, $lt: end },
        } },
        { $group: {
          _id: null,
          completedTrips: { $sum: 1 },
          distanceKm: { $sum: { $ifNull: ['$estimatedDistanceKm', 0] } },
          confirmedEarnings: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, { $ifNull: ['$totalAmount', 0] }, 0] } },
          rating: { $avg: '$customerRating.score' },
        } },
      ]),
      Booking.countDocuments(upcomingFilter),
      Booking.findOne(upcomingFilter).sort({ scheduledStartAt: 1, _id: 1 })
        .select('bookingNumber pickup requestedVehicleVariant scheduledStartAt status').lean(),
    ]);
    const today = todayRows[0] || { completedTrips: 0, distanceKm: 0, confirmedEarnings: 0 };
    return res.json({ success: true, data: {
      today: {
        completedTrips: today.completedTrips,
        distanceKm: Math.round(today.distanceKm * 10) / 10,
        earnings: Math.round(today.confirmedEarnings * 100) / 100,
        rating: today.rating == null ? null : Math.round(today.rating * 10) / 10,
      },
      upcomingCount,
      nextTrip: nextTrip ? {
        id: String(nextTrip._id),
        bookingNumber: nextTrip.bookingNumber,
        pickup: nextTrip.pickup,
        vehicleVariant: nextTrip.requestedVehicleVariant,
        scheduledStartAt: nextTrip.scheduledStartAt,
        status: nextTrip.status,
      } : null,
    } });
  } catch (error) { return next(error); }
});

router.get('/history', validate(historySchema), async (req, res, next) => {
  try {
    const driverMatch = {
      $or: [
        { currentDriverId: req.driver._id },
        { 'assignments.driverId': req.driver._id },
      ],
    };
    const terminalStatuses = ['COMPLETED', 'CANCELLED', 'NO_SHOW'];
    const requestedStatus = req.validated.query.status;
    const filter = {
      ...driverMatch,
      status: requestedStatus === 'ALL' ? { $in: terminalStatuses } : requestedStatus,
    };
    const now = new Date();
    const istNow = new Date(now.getTime() + 330 * 60000);
    const monthStart = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), 1) - 330 * 60000);
    const [rides, summaryRows] = await Promise.all([
      Booking.find(filter).sort({ updatedAt: -1, _id: -1 }).limit(100)
        .select('bookingNumber pickup destination status totalAmount estimatedDistanceKm paymentMethod paymentChannel cancellation customerRating completedAt updatedAt').lean(),
      Booking.aggregate([
        { $match: { ...driverMatch, status: { $in: terminalStatuses }, updatedAt: { $gte: monthStart } } },
        { $group: {
          _id: null,
          totalRides: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] } },
          noShow: { $sum: { $cond: [{ $eq: ['$status', 'NO_SHOW'] }, 1, 0] } },
          earnings: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, { $ifNull: ['$totalAmount', 0] }, 0] } },
        } },
      ]),
    ]);
    const summary = summaryRows[0] || { totalRides: 0, completed: 0, cancelled: 0, noShow: 0, earnings: 0 };
    return res.json({ success: true, data: {
      summary: { ...summary, _id: undefined, earnings: money(summary.earnings) },
      rides: rides.map((ride) => ({
        id: String(ride._id),
        bookingNumber: ride.bookingNumber,
        pickup: ride.pickup,
        destination: ride.destination,
        status: ride.status,
        amount: money(ride.totalAmount),
        distanceKm: Math.round(Number(ride.estimatedDistanceKm || 0) * 10) / 10,
        paymentMethod: ride.paymentMethod || ride.paymentChannel,
        cancellation: ride.cancellation,
        rating: ride.customerRating,
        occurredAt: ride.completedAt || ride.cancellation?.at || ride.updatedAt,
      })),
    } });
  } catch (error) { return next(error); }
});

router.get('/earnings', async (req, res, next) => {
  try {
    const period = ['DAILY', 'WEEKLY', 'MONTHLY'].includes(req.query.period)
      ? req.query.period : 'DAILY';
    const now = Date.now();
    const { start: todayStart, end: todayEnd } = indiaDayBounds(now);
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    const buckets = earningBuckets(period, now);
    const branches = buckets.map((bucket) => ({
      case: { $and: [
        { $gte: ['$completedAt', bucket.start] },
        { $lt: ['$completedAt', bucket.end] },
      ] },
      then: bucket.index,
    }));
    const paidFilter = { currentDriverId: req.driver._id, status: 'COMPLETED' };
    const [periodRows, todayRows, yesterdayRows, lifetimeRows, payoutRows, recentRides, nextPayout] = await Promise.all([
      Booking.aggregate([
        { $match: { ...paidFilter, completedAt: { $gte: buckets[0].start, $lt: buckets.at(-1).end } } },
        { $group: { _id: { $switch: { branches, default: -1 } }, amount: { $sum: { $ifNull: ['$totalAmount', 0] } } } },
      ]),
      Booking.aggregate([
        { $match: { currentDriverId: req.driver._id, status: { $in: ['PAYMENT_PENDING', 'COMPLETED'] }, completedAt: { $gte: todayStart, $lt: todayEnd } } },
        { $group: {
          _id: null,
          completedTrips: { $sum: 1 },
          distanceKm: { $sum: { $ifNull: ['$estimatedDistanceKm', 0] } },
          tripEarnings: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, { $ifNull: ['$totalAmount', 0] }, 0] } },
        } },
      ]),
      Booking.aggregate([
        { $match: { ...paidFilter, completedAt: { $gte: yesterdayStart, $lt: todayStart } } },
        { $group: { _id: null, earnings: { $sum: { $ifNull: ['$totalAmount', 0] } } } },
      ]),
      Booking.aggregate([
        { $match: paidFilter },
        { $group: { _id: null, earnings: { $sum: { $ifNull: ['$totalAmount', 0] } } } },
      ]),
      DriverPayout.aggregate([
        { $match: {
          driverId: req.driver._id,
          periodStart: { $gte: todayStart, $lt: todayEnd },
          periodEnd: { $lte: todayEnd },
        } },
        { $group: { _id: null, incentives: { $sum: '$incentives' }, deductions: { $sum: '$deductions' } } },
      ]),
      Booking.find({ ...paidFilter, completedAt: { $ne: null } }).sort({ completedAt: -1 }).limit(20)
        .select('bookingNumber pickup destination totalAmount completedAt').lean(),
      DriverPayout.findOne({ driverId: req.driver._id, status: { $in: ['PENDING', 'PROCESSING'] } })
        .sort({ payoutDate: 1, periodEnd: 1 }).select('payoutDate periodEnd status netPayout').lean(),
    ]);
    const values = Array(7).fill(0);
    for (const row of periodRows) if (row._id >= 0 && row._id < values.length) values[row._id] = money(row.amount);
    const current = values[6];
    const previous = values[5];
    const changePercent = previous > 0 ? Math.round((current - previous) * 1000 / previous) / 10 : null;
    const today = todayRows[0] || { completedTrips: 0, distanceKm: 0, tripEarnings: 0 };
    const payout = payoutRows[0] || { incentives: 0, deductions: 0 };
    const tripEarnings = money(today.tripEarnings);
    const incentives = money(payout.incentives);
    const deductions = money(payout.deductions);
    const yesterdayEarnings = money(yesterdayRows[0]?.earnings);
    const todayTotal = money(tripEarnings + incentives - deductions);
    const todayChangePercent = yesterdayEarnings > 0
      ? Math.round((tripEarnings - yesterdayEarnings) * 1000 / yesterdayEarnings) / 10 : null;
    const periodLabels = period === 'DAILY'
      ? ['Today', 'Yesterday'] : period === 'WEEKLY'
      ? ['This Week', 'Last Week'] : ['This Month', 'Last Month'];
    return res.json({ success: true, data: {
      period,
      today: {
        earnings: todayTotal,
        totalEarnings: money(lifetimeRows[0]?.earnings),
        completedTrips: today.completedTrips,
        distanceKm: Math.round(today.distanceKm * 10) / 10,
        changePercent: todayChangePercent,
      },
      overview: {
        currentLabel: periodLabels[0], previousLabel: periodLabels[1],
        current, previous, changePercent,
        bars: buckets.map((bucket) => ({ label: bucket.label, amount: values[bucket.index], active: bucket.index === 6 })),
      },
      breakup: { total: todayTotal, tripEarnings, incentives, deductions },
      transactions: recentRides.map((ride) => ({
        id: String(ride._id),
        title: `${ride.pickup?.address || 'Pickup'} → ${ride.destination?.address || 'Destination'}`,
        occurredAt: ride.completedAt,
        amount: money(ride.totalAmount),
        type: 'TRIP_EARNING',
      })),
      payout: nextPayout ? {
        status: nextPayout.status,
        amount: money(nextPayout.netPayout),
        scheduledAt: nextPayout.payoutDate || nextPayout.periodEnd,
      } : null,
    } });
  } catch (error) { return next(error); }
});

router.get('/profile-summary', async (req, res, next) => {
  try {
    const now = new Date();
    const istNow = new Date(now.getTime() + 330 * 60000);
    const monthStart = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), 1) - 330 * 60000);
    const [summary] = await Booking.aggregate([
      { $facet: {
        allCompleted: [
          { $match: { currentDriverId: req.driver._id, status: 'COMPLETED' } },
          { $group: { _id: null, count: { $sum: 1 }, averageRating: { $avg: '$customerRating.score' } } },
        ],
        monthlyCompleted: [
          { $match: { currentDriverId: req.driver._id, status: 'COMPLETED', completedAt: { $gte: monthStart } } },
          { $group: { _id: null, trips: { $sum: 1 }, distanceKm: { $sum: { $ifNull: ['$estimatedDistanceKm', 0] } },
            averageRating: { $avg: '$customerRating.score' } } },
        ],
        monthlyAccepted: [
          { $match: { currentDriverId: req.driver._id, updatedAt: { $gte: monthStart } } },
          { $count: 'count' },
        ],
        monthlyRejected: [
          { $match: { rejectedDriverIds: req.driver._id, updatedAt: { $gte: monthStart } } },
          { $count: 'count' },
        ],
      } },
    ]);
    const completed = summary?.monthlyCompleted?.[0] || {};
    const accepted = summary?.monthlyAccepted?.[0]?.count || 0;
    const rejected = summary?.monthlyRejected?.[0]?.count || 0;
    const offered = accepted + rejected;
    return res.json({ success: true, data: {
      totalTrips: summary?.allCompleted?.[0]?.count || 0,
      averageRating: summary?.allCompleted?.[0]?.averageRating == null ? null
        : Math.round(summary.allCompleted[0].averageRating * 10) / 10,
      thisMonth: {
        completedTrips: completed.trips || 0,
        distanceKm: Math.round((completed.distanceKm || 0) * 10) / 10,
        averageRating: completed.averageRating == null ? null : Math.round(completed.averageRating * 10) / 10,
        acceptanceRate: offered > 0 ? Math.round(accepted * 1000 / offered) / 10 : null,
      },
    } });
  } catch (error) { return next(error); }
});

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
    if (req.driver.operationalStatus === 'ONLINE') {
      const now = Date.now();
      const scheduled = await Booking.findOne({
        currentDriverId: req.driver._id,
        timing: 'SCHEDULED',
        status: { $in: ['ASSIGNED', 'DRIVER_ACCEPTED'] },
        scheduledStartAt: { $gt: new Date(now), $lte: new Date(now + 3 * 60 * 60000) },
      }).sort({ scheduledStartAt: 1 });
      if (scheduled && !preparationIsFresh(scheduled.pickupPreparation, req.driver.id, now)) {
        try {
          await preparePickup(scheduled, req.driver, { ...req.validated.body, recordedAt });
        } catch (error) {
          // A route API outage must not discard an otherwise valid GPS update.
          console.warn('Scheduled pickup ETA refresh postponed', { bookingId: scheduled.id, code: error.code || 'ROUTE_UNAVAILABLE' });
        }
      }
    }
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
        $set: { currentDriverId: req.driver._id, status: 'DRIVER_ACCEPTED', pickupDueAt: immediatePickupDueAt(new Date()) },
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
    const location = req.driver.currentLocation;
    const age = Date.now() - new Date(location?.recordedAt).getTime();
    if (Number.isFinite(location?.latitude) && Number.isFinite(location?.longitude) && age >= 0 && age <= 60000) {
      try {
        const route = await computeRoute({ origin: location, destination: booking.pickup });
        await Booking.updateOne(
          { _id: booking._id, currentDriverId: req.driver._id, status: 'DRIVER_ACCEPTED' },
          { $set: { pickupDueAt: immediatePickupDueAt(booking.updatedAt, route.durationMinutes) } },
        );
      } catch (error) {
        console.warn('Using 30-minute pickup cancellation fallback', { bookingId: booking.id, code: error.code || 'ROUTE_UNAVAILABLE' });
      }
    }
    sendCustomerBookingPush(booking, 'DRIVER_ACCEPTED');
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
    sendCustomerBookingPush(booking, to);
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
    const arrived = await Booking.findOneAndUpdate(
      { _id: booking._id, currentDriverId: req.driver._id, status: 'DRIVER_EN_ROUTE' },
      { $set: { status: 'ARRIVED', arrivedAt: new Date(), tripStartOtp: String(Math.floor(100000 + Math.random() * 900000)) },
        $push: { statusHistory: { status: 'ARRIVED', note: `Driver arrived ${Math.round(distance)} m from pickup; waiting timer started` } } },
      { new: true, runValidators: true },
    );
    if (!arrived) throw new AppError(409, 'INVALID_TRIP_TRANSITION', 'The trip changed. Refresh and try again');
    sendCustomerBookingPush(arrived, 'ARRIVED');
    return res.json({ success: true, data: { trip: toActiveTrip(arrived) } });
  } catch (error) { return next(error); }
});

router.post('/:bookingId/customer-no-show', validate(idSchema), async (req, res, next) => {
  try {
    const existing = await Booking.findOne({
      _id: req.validated.params.bookingId,
      currentDriverId: req.driver._id,
      status: 'ARRIVED',
    });
    if (!existing || !customerNoShowState(existing).canMarkCustomerNoShow) {
      throw new AppError(409, 'NO_SHOW_NOT_AVAILABLE', 'Customer no-show is available 10 minutes after verified arrival, before trip start');
    }
    const booking = await Booking.findOneAndUpdate(
      { _id: existing._id, currentDriverId: req.driver._id, status: 'ARRIVED', arrivedAt: { $lte: new Date(Date.now() - 10 * 60000) } },
      { $set: { status: 'NO_SHOW', cancellation: { actor: 'DRIVER', reason: 'CUSTOMER_NO_SHOW', at: new Date() } },
        $unset: { tripStartOtp: '' },
        $push: { statusHistory: { status: 'NO_SHOW', note: 'Driver marked customer no-show after verified arrival and 10-minute wait' } } },
      { new: true, runValidators: true },
    );
    if (!booking) throw new AppError(409, 'NO_SHOW_NOT_AVAILABLE', 'The trip changed. Refresh and try again');
    await releaseDriverAfterPickupEnds(req.driver._id);
    sendCustomerBookingPush(booking, 'NO_SHOW');
    return res.json({ success: true, data: { trip: toActiveTrip(booking) } });
  } catch (error) { return next(error); }
});

router.post('/:bookingId/start', validate(startSchema), async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.validated.params.bookingId, currentDriverId: req.driver._id, status: 'ARRIVED' }).select('+tripStartOtp');
    if (!booking) throw new AppError(409, 'INVALID_TRIP_TRANSITION', 'This trip is not ready to start');

    if (booking.tripStartOtp !== req.validated.body.otp) throw new AppError(400, 'INVALID_TRIP_OTP', 'The trip OTP is incorrect');

    const started = await Booking.findOneAndUpdate(
      { _id: booking._id, currentDriverId: req.driver._id, status: 'ARRIVED', tripStartOtp: req.validated.body.otp },
      { $set: { status: 'IN_PROGRESS', startedAt: new Date() },
        $unset: { tripStartOtp: '' },
        $push: { statusHistory: { status: 'IN_PROGRESS', note: 'Trip started after OTP verification' } } },
      { new: true, runValidators: true },
    );
    if (!started) throw new AppError(409, 'INVALID_TRIP_TRANSITION', 'The trip changed. Refresh and try again');
    sendCustomerBookingPush(started, 'IN_PROGRESS');
    return res.json({ success: true, data: { trip: toActiveTrip(started) } });
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
    sendCustomerBookingPush(booking, 'PAYMENT_PENDING');
    return res.json({ success: true, data: { trip: toActiveTrip(booking) } });
  } catch (error) { 
    return next(error); 
  }
});

export { router as driverTripRouter };

import express from 'express';
import crypto from 'node:crypto';
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
import { closeQrCode, createOrder, fetchPayment, verifyCheckoutSignature } from '../payments/razorpay.service.js';
import { createSingleFlight } from '../../common/single-flight.js';
import { scheduledPickupState } from '../bookings/scheduled-pickup-policy.js';
import { pickupCancellationState } from '../bookings/pickup-cancellation.policy.js';
import { releaseDriverAfterPickupEnds } from '../bookings/release-driver.service.js';

const router = express.Router();
const paymentOrderFlight = createSingleFlight();
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
    scheduledFor: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid scheduled date').optional(),
    idempotencyKey: z.string().regex(/^[a-zA-Z0-9_-]{16,100}$/).optional(),
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
const cancelSchema = z.object({
  body: z.object({
    reason: z.enum(['DRIVER_LATE', 'DRIVER_NOT_MOVING', 'CANNOT_CONTACT_DRIVER']).optional(),
  }),
  params: z.object({ bookingId: id }),
  query: empty,
});

const verifyPaymentSchema = z.object({
  body: z.object({
    razorpayPaymentId: z.string().min(5).max(100),
    razorpayOrderId: z.string().min(5).max(100),
    razorpaySignature: z.string().min(20).max(200),
  }),
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
  amount: booking.walletPaidAmount ?? booking.totalAmount,
  walletDiscountAmount: booking.walletDiscountAmount,
  walletPaymentAvailable: booking.status === 'PAYMENT_PENDING' && !booking.paymentChannel && !booking.razorpayOrderId && !booking.razorpayQrCodeId,
  pricing: booking.pricingSnapshot,
  status: booking.status,
  paymentStatus: booking.paymentStatus,
  paymentMethod: booking.paymentMethod,
  ...booking.status === 'PAYMENT_PENDING' ? {
    razorpayKeyId: env.RAZORPAY_KEY_ID,
    razorpayOrderId: booking.razorpayOrderId,
    qrImageUrl: booking.razorpayQrImageUrl,
  } : {},
  createdAt: booking.createdAt,
  serviceType: booking.serviceType,
  timing: booking.timing,
  pickupOverdue: scheduledPickupState(booking).pickupOverdue,
  ...pickupCancellationState(booking),
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
    currentLocation: booking.currentDriverId.currentLocation?.recordedAt
      && Date.now() - new Date(booking.currentDriverId.currentLocation.recordedAt).getTime() <= 60000
      ? booking.currentDriverId.currentLocation
      : undefined,
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
        { 
          $match: { 
            status: 'ACTIVE', 
            operationalStatus: 'ONLINE', 
            serviceAssignment: { 
              $in: ['LOCAL', 'FLEXIBLE', null] 
            }, 
            'vehicle.categoryId': { $exists: true }, 
            'vehicle.variantId': { $exists: true } 
          } 
        },
        { 
          $group: { 
            _id: { 
              categoryId: '$vehicle.categoryId', 
              variantId: '$vehicle.variantId' 
            }, 
            count: { $sum: 1 } 
          } 
        },
      ]),
      computeRoute({
        origin: { 
          latitude: pickupLatitude, 
          longitude: pickupLongitude 
        },
        destination: { 
          latitude: destinationLatitude, 
          longitude: destinationLongitude 
        },
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
  } catch (error) { 
    return next(error); 
  }
});

router.post('/', validate(createSchema), async (req, res, next) => {
  const { idempotencyKey, ...requestBody } = req.validated.body;
  const bookingRequestHash = crypto.createHash('sha256').update(JSON.stringify(requestBody)).digest('hex');
  const replay = async () => {
    if (!idempotencyKey) return null;
    const existing = await Booking.findOne({ customerId: req.customer.id, bookingRequestKey: idempotencyKey }).populate('currentDriverId', 'personal.fullName personal.phone personal.profilePhoto vehicle currentLocation');
    if (existing && existing.bookingRequestHash !== bookingRequestHash) throw new AppError(409, 'IDEMPOTENCY_CONFLICT', 'Use a new retry key when changing booking details');
    return existing;
  };
  try {
    const existing = await replay();
    if (existing) return res.json({ success: true, data: { booking: toCustomerBooking(existing) } });
    const { pickupAddress, destinationAddress, pickupLatitude, pickupLongitude,
      destinationLatitude, destinationLongitude, categoryId, variantId, paymentMethod, scheduledFor } =
      req.validated.body;

    const scheduledStart = scheduledFor ? new Date(scheduledFor) : null;
    if (scheduledStart) {
      const minimum = Date.now() + 30 * 60 * 1000;
      const maximum = Date.now() + 90 * 24 * 60 * 60 * 1000;
      if (scheduledStart.getTime() < minimum) {
        throw new AppError(422, 'SCHEDULE_TOO_SOON', 'Please schedule the ride at least 30 minutes in advance');
      }
      if (scheduledStart.getTime() > maximum) {
        throw new AppError(422, 'SCHEDULE_TOO_FAR', 'Rides can be scheduled up to 90 days in advance');
      }
    }

    const [category, variant] = await Promise.all([
      VehicleCategory.findOne({ _id: categoryId, isActive: true }),
      VehicleVariant.findOne({ _id: variantId, categoryId, isActive: true, onRoadPrice: { $gt: 0 } }),
    ]);

    if (!category || !variant) throw new AppError(422, 'VEHICLE_UNAVAILABLE', 'This vehicle option is no longer available');

    const availableDriver = await Driver.exists({ 
      status: 'ACTIVE', 
      operationalStatus: 'ONLINE', 
      serviceAssignment: { $in: ['LOCAL', 'FLEXIBLE', null] }, 
      'vehicle.categoryId': categoryId, 
      'vehicle.variantId': variantId 
    });

    if (!scheduledStart && !availableDriver) throw new AppError(409, 'NO_DRIVER_AVAILABLE', `No ${variant.name} driver is currently available`);

    const route = await computeRoute({
      origin: { 
        latitude: pickupLatitude, 
        longitude: pickupLongitude 
      },
      destination: { 
        latitude: destinationLatitude, 
        longitude: destinationLongitude 
      },
    });
    const start = scheduledStart ?? new Date();
    const end = new Date(start.getTime() + Math.max(route.durationMinutes, 15) * 60 * 1000);
    const estimatedDistanceKm = route.distanceKm;
    const pricingSnapshot = calculateLocalFare({
      onRoadPrice: variant.onRoadPrice,
      distanceKm: estimatedDistanceKm,
      bookedAt: start,
    });

    const booking = await Booking.createWithUniqueNumber({
      ...(idempotencyKey ? { bookingRequestKey: idempotencyKey, bookingRequestHash } : {}),
      customerId: req.customer.id,
      customer: { name: req.customer.name, phone: req.customer.phone },
      serviceType: scheduledStart ? 'SCHEDULED_RIDE' : 'IMMEDIATE_RIDE',
      timing: scheduledStart ? 'SCHEDULED' : 'IMMEDIATE',
      pickup: { 
        address: pickupAddress, 
        latitude: pickupLatitude, 
        longitude: pickupLongitude 
      },
      destination: { 
        address: destinationAddress, 
        latitude: destinationLatitude, 
        longitude: destinationLongitude 
      },
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
      status: scheduledStart ? 'NEW' : 'SEARCHING_DRIVER',
      assignmentDeadline: scheduledStart ? undefined : new Date(Date.now() + 45 * 1000),
      statusHistory: [
        { 
          status: scheduledStart ? 'NEW' : 'SEARCHING_DRIVER',
          note: scheduledStart ? 'Scheduled ride created; awaiting driver assignment' : 'Searching for a nearby driver',
        },
      ],
    });

    return res.status(201).json({
      success: true,
      data: { booking: toCustomerBooking(booking) },
    });
  } catch (error) {
    if (idempotencyKey && error?.code === 11000 && error.keyPattern?.bookingRequestKey) {
      try {
        const existing = await replay();
        if (existing) return res.json({ success: true, data: { booking: toCustomerBooking(existing) } });
      } catch (replayError) { return next(replayError); }
    }
    return next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    await expireDriverSearches({ customerId: req.customer.id });
    const bookings = await Booking.find({ customerId: req.customer.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('currentDriverId', 'personal.fullName personal.phone personal.profilePhoto vehicle currentLocation');
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
    }).select('+tripStartOtp').populate('currentDriverId', 'personal.fullName personal.phone personal.profilePhoto vehicle currentLocation');

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

router.get('/:bookingId/receipt', validate(bookingIdSchema), async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.validated.params.bookingId,
      customerId: req.customer.id,
      status: 'COMPLETED',
      paymentStatus: 'PAID',
    }).populate('currentDriverId', 'personal.fullName vehicle.registrationNumber');

    if (!booking) {
      throw new AppError(404, 'RECEIPT_NOT_AVAILABLE', 'A receipt is available only after this ride is paid');
    }

    const payment = await Payment.findOne({
      bookingId: booking._id,
      status: { $in: ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'] },
    }).sort({ paidAt: -1, createdAt: -1 }).lean();

    if (!payment) {
      throw new AppError(404, 'RECEIPT_NOT_AVAILABLE', 'The payment receipt is still being prepared');
    }

    const pricing = booking.pricingSnapshot?.toObject?.() ?? booking.pricingSnapshot ?? {};
    const driver = booking.currentDriverId && typeof booking.currentDriverId === 'object'
      ? booking.currentDriverId
      : null;

    return res.json({
      success: true,
      data: {
        receipt: {
          receiptNumber: `RCP-${booking.bookingNumber}`,
          bookingNumber: booking.bookingNumber,
          issuedAt: payment.paidAt ?? payment.updatedAt ?? payment.createdAt,
          payment: {
            status: payment.status,
            method: payment.method,
            methodDisplay: payment.methodDisplay,
            transactionId: payment.transactionId,
            razorpayPaymentId: payment.razorpayPaymentId,
            razorpayOrderId: payment.razorpayOrderId,
            amount: payment.amount,
            currency: 'INR',
          },
          customer: booking.customer,
          ride: {
            serviceType: booking.serviceType,
            vehicleVariant: booking.requestedVehicleVariant,
            pickup: booking.pickup,
            destination: booking.destination,
            startedAt: booking.startedAt,
            completedAt: booking.completedAt,
            distanceKm: booking.estimatedDistanceKm,
            driverName: driver?.personal?.fullName,
            vehicleRegistrationNumber: driver?.vehicle?.registrationNumber,
          },
          fare: {
            minimumFare: pricing.minimumFare ?? 0,
            distanceFare: pricing.distanceFare ?? 0,
            waitingMinutes: pricing.waitingMinutes ?? 0,
            freeWaitingMinutes: pricing.freeWaitingMinutes ?? 0,
            chargeableWaitingMinutes: pricing.chargeableWaitingMinutes ?? 0,
            waitingCharge: pricing.waitingCharge ?? 0,
            nightSurcharge: pricing.nightSurcharge ?? 0,
            tollCharge: pricing.tollCharge ?? 0,
            parkingCharge: pricing.parkingCharge ?? 0,
            taxableSubtotal: pricing.taxableSubtotal ?? 0,
            gstPercent: pricing.gstPercent ?? 0,
            gstAmount: pricing.gstAmount ?? 0,
            originalTotal: booking.totalAmount,
            walletDiscount: booking.walletDiscountAmount ?? 0,
            total: payment.amount,
          },
          merchant: { name: 'RJS Tours and Travels' },
        },
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/:bookingId/payment-order', validate(bookingIdSchema), async (req, res, next) => {
  try {
    const booking = await Booking.findOneAndUpdate({
      _id: req.validated.params.bookingId,
      customerId: req.customer.id,
      status: 'PAYMENT_PENDING',
      paymentStatus: 'PENDING',
      paymentChannel: { $ne: 'WALLET' },
    }, { $set: { paymentChannel: 'RAZORPAY' } }, { new: true });

    if (!booking) throw new AppError(409, 'PAYMENT_NOT_AVAILABLE', 'The final trip bill is not ready for payment');

    if (!booking.razorpayOrderId) {
      booking.razorpayOrderId = await paymentOrderFlight(booking.id, async () => {
        const fresh = await Booking.findById(booking._id);
        if (fresh.razorpayOrderId) return fresh.razorpayOrderId;
        if (fresh.status !== 'PAYMENT_PENDING' || fresh.paymentStatus !== 'PENDING') throw new AppError(409, 'PAYMENT_NOT_AVAILABLE', 'This ride is no longer awaiting payment');
        const order = await createOrder(fresh);
        await Booking.updateOne({ _id: booking._id }, { $set: { razorpayOrderId: order.id } });
        return order.id;
      });
    }

    return res.json({
      success: true,
      data: {
        keyId: env.RAZORPAY_KEY_ID,
        orderId: booking.razorpayOrderId,
        amountPaise: Math.round(booking.totalAmount * 100),
        currency: 'INR',
        name: 'RJS Tours and Travels',
        description: `Payment for ${booking.bookingNumber}`,
        customer: booking.customer,
      },
    });
  } catch (error) { return next(error); }
});

router.post('/:bookingId/verify-payment', validate(verifyPaymentSchema), async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.validated.params.bookingId,
      customerId: req.customer.id,
      status: 'PAYMENT_PENDING',
      paymentStatus: 'PENDING',
    });

    if (!booking || booking.razorpayOrderId !== req.validated.body.razorpayOrderId) {
      throw new AppError(409, 'PAYMENT_NOT_AVAILABLE', 'This payment order is no longer active');
    }

    const authentic = verifyCheckoutSignature({
      orderId: booking.razorpayOrderId,
      paymentId: req.validated.body.razorpayPaymentId,
      signature: req.validated.body.razorpaySignature,
    });

    if (!authentic) throw new AppError(400, 'INVALID_PAYMENT_SIGNATURE', 'Payment verification failed');

    const gatewayPayment = await fetchPayment(req.validated.body.razorpayPaymentId);
    if (gatewayPayment.status !== 'captured'
        || gatewayPayment.order_id !== booking.razorpayOrderId
        || gatewayPayment.amount !== Math.round(booking.totalAmount * 100)) {
      throw new AppError(409, 'PAYMENT_NOT_CAPTURED', 'Payment is still processing; it will update automatically');
    }

    await Payment.findOneAndUpdate(
      { bookingId: booking._id },
      { $set: {
        transactionId: gatewayPayment.id,
        razorpayPaymentId: gatewayPayment.id,
        razorpayOrderId: gatewayPayment.order_id,
        gatewayReference: gatewayPayment.id,
        method: gatewayPayment.method === 'upi' ? 'UPI' : 'CARD',
        methodDisplay: `Razorpay ${gatewayPayment.method}`,
        amount: booking.totalAmount,
        status: 'PAID',
        paidAt: new Date(),
        customerName: booking.customer.name,
        customerPhone: booking.customer.phone,
        bookingType: booking.serviceType,
      }},
      { upsert: true, new: true, runValidators: true },
    );

    booking.status = 'COMPLETED';
    booking.paymentStatus = 'PAID';
    booking.paymentMethod = gatewayPayment.method === 'upi' ? 'UPI' : 'CARD';
    booking.statusHistory.push({ status: 'COMPLETED', note: 'Razorpay payment verified and captured' });

    await booking.save();

    if (booking.razorpayQrCodeId) await closeQrCode(booking.razorpayQrCodeId).catch(() => {});

    await Driver.updateOne({ _id: booking.currentDriverId }, { $set: { operationalStatus: 'ONLINE' } });
    return res.json({ success: true, data: { booking: toCustomerBooking(booking) } });
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

router.post('/:bookingId/cancel', validate(cancelSchema), async (req, res, next) => {
  try {
    const existing = await Booking.findOne({ _id: req.validated.params.bookingId, customerId: req.customer.id });
    if (!existing) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
    const latePickup = pickupCancellationState(existing).canCancelLatePickup;
    const confirmed = ['ASSIGNED', 'DRIVER_ACCEPTED', 'DRIVER_EN_ROUTE'].includes(existing.status);
    if (confirmed && (!latePickup || !req.validated.body.reason)) {
      throw new AppError(409, 'PICKUP_NOT_LATE', 'Cancellation is available only after the driver is late to pickup and a reason is selected');
    }
    if (!confirmed && !['SEARCHING_DRIVER', 'AWAITING_PAYMENT', 'NO_DRIVER_AVAILABLE'].includes(existing.status)) {
      throw new AppError(409, 'BOOKING_CANNOT_BE_CANCELLED', 'This booking can no longer be cancelled');
    }
    const reason = confirmed ? req.validated.body.reason : 'SEARCH_CANCELLED';
    const now = new Date();
    const booking = await Booking.findOneAndUpdate(
      {
        _id: req.validated.params.bookingId,
        customerId: req.customer.id,
        status: existing.status,
        updatedAt: existing.updatedAt,
        ...(confirmed ? { currentDriverId: existing.currentDriverId } : {}),
      },
      {
        $set: { status: 'CANCELLED', cancellation: { actor: 'CUSTOMER', reason, at: now } },
        $push: {
          statusHistory: {
            status: 'CANCELLED',
            note: `Cancelled by customer: ${reason}`,
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
    if (confirmed) await releaseDriverAfterPickupEnds(booking.currentDriverId);
    return res.json({
      success: true,
      data: { booking: toCustomerBooking(booking) },
    });
  } catch (error) {
    return next(error);
  }
});

export { router as customerBookingRouter };

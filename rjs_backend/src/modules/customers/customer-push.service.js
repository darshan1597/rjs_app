import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

import { Customer, CustomerSession } from './customer.model.js';

const messages = {
  ASSIGNED: ['Driver assigned', 'A driver has been assigned to your ride.'],
  DRIVER_ACCEPTED: ['Driver accepted your ride', 'Your driver has accepted and is preparing for pickup.'],
  DRIVER_EN_ROUTE: ['Driver is on the way', 'Track your driver live while they travel to the pickup.'],
  ARRIVED: ['Driver has arrived', 'Meet your driver at the pickup and share the trip OTP.'],
  IN_PROGRESS: ['Trip started', 'Your ride is now in progress.'],
  PAYMENT_PENDING: ['Payment due', 'Your final bill is ready. Pay in the app or using the driver QR.'],
  COMPLETED: ['Ride completed', 'Payment is complete and your receipt is available.'],
  CANCELLED: ['Ride cancelled', 'This booking has been cancelled.'],
  NO_SHOW: ['Ride closed', 'This booking was closed as a customer no-show.'],
  NO_DRIVER_AVAILABLE: ['No driver available', 'No driver accepted this request. You can search again.'],
};

function messaging() {
  if (getApps().length === 0) initializeApp({ credential: applicationDefault() });
  return getMessaging();
}

async function sendCustomerBookingPush(booking, status = booking?.status) {
  const text = messages[status];
  const customerId = booking?.customerId;
  if (!text || !customerId) return { sent: 0 };
  try {
    const customer = await Customer.findById(customerId).select('notificationPreferences').lean();
    if (customer?.notificationPreferences?.pushEnabled === false ||
        customer?.notificationPreferences?.rideUpdates === false) return { sent: 0 };
    const sessions = await CustomerSession.find({
      customerId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
      pushToken: { $exists: true, $ne: '' },
    }).select('+pushToken').limit(10).lean();
    const tokens = [...new Set(sessions.map((session) => session.pushToken).filter(Boolean))];
    if (tokens.length === 0) return { sent: 0 };
    const response = await messaging().sendEachForMulticast({
      tokens,
      notification: { title: text[0], body: `${text[1]} (${booking.bookingNumber})` },
      data: {
        type: 'BOOKING_UPDATE',
        bookingId: String(booking._id),
        status,
      },
      android: { priority: 'high', notification: { tag: `booking-${booking._id}` } },
    });
    const invalid = [];
    response.responses.forEach((result, index) => {
      if (!result.success && ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(result.error?.code)) {
        invalid.push(tokens[index]);
      }
    });
    if (invalid.length) {
      await CustomerSession.updateMany(
        { pushToken: { $in: invalid } },
        { $unset: { pushToken: 1, pushPlatform: 1 } },
      );
    }
    return { sent: response.successCount };
  } catch (error) {
    console.warn('Customer push delivery postponed', {
      bookingId: String(booking?._id || ''),
      status,
      code: error.code || 'PUSH_UNAVAILABLE',
    });
    return { sent: 0 };
  }
}

async function sendCustomerPushMessage({ customerId, title, body, data = {}, tag, ttl }) {
  if (!customerId || !title || !body) return { sent: 0, retryable: false };
  try {
    const customer = await Customer.findById(customerId).select('notificationPreferences').lean();
    if (!customer || customer.notificationPreferences?.pushEnabled === false ||
        customer.notificationPreferences?.rideUpdates === false) return { sent: 0, retryable: false };
    const sessions = await CustomerSession.find({
      customerId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
      pushToken: { $exists: true, $ne: '' },
    }).select('+pushToken').limit(10).lean();
    const tokens = [...new Set(sessions.map((session) => session.pushToken).filter(Boolean))];
    if (!tokens.length) return { sent: 0, retryable: false };
    const response = await messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)])),
      android: {
        priority: 'high',
        ...(Number.isFinite(ttl) ? { ttl: Math.max(0, ttl) } : {}),
        notification: tag ? { tag } : undefined,
      },
    });
    const invalid = [];
    response.responses.forEach((result, index) => {
      if (!result.success && ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(result.error?.code)) {
        invalid.push(tokens[index]);
      }
    });
    if (invalid.length) await CustomerSession.updateMany(
      { pushToken: { $in: invalid } }, { $unset: { pushToken: 1, pushPlatform: 1 } },
    );
    return { sent: response.successCount, retryable: response.successCount === 0 };
  } catch (error) {
    console.warn('Customer push delivery postponed', {
      customerId: String(customerId),
      type: data.type || 'CUSTOMER_NOTIFICATION',
      code: error.code || 'PUSH_UNAVAILABLE',
    });
    return { sent: 0, retryable: true };
  }
}

export { sendCustomerBookingPush, sendCustomerPushMessage };

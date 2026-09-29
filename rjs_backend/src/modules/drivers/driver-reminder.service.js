import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

import { env } from '../../config/env.js';
import { Booking } from '../bookings/booking.model.js';
import { preparationIsFresh } from '../bookings/pickup-preparation.service.js';
import { DriverSession } from './driver-auth.model.js';
import { DriverReminder } from './driver-reminder.model.js';
import { Driver } from './driver.model.js';

const MINUTE = 60000;
const PREPARE_LEAD_MS = 60 * MINUTE;
const ROUTE_CHECK_LEAD_MS = 30 * MINUTE;
const RETRY_MS = 2 * MINUTE;
const CLAIM_MS = 2 * MINUTE;

export function reminderToCreate(booking, kind, now = Date.now()) {
  const pickupAt = new Date(booking.scheduledStartAt).getTime();
  if (booking.timing !== 'SCHEDULED' || !['ASSIGNED', 'DRIVER_ACCEPTED'].includes(booking.status) ||
      !booking.currentDriverId || !Number.isFinite(pickupAt) || now >= pickupAt) return null;

  const number = booking.bookingNumber || 'your scheduled ride';
  let title;
  let body;
  if (kind === 'PREPARE') {
    if (now < pickupAt - PREPARE_LEAD_MS) return null;
    title = 'Scheduled pickup coming up';
    const minutesLeft = Math.max(1, Math.ceil((pickupAt - now) / MINUTE));
    body = `${number} pickup is in ${minutesLeft} minutes. Go online and check the pickup route.`;
  } else if (kind === 'ROUTE_CHECK') {
    const preparation = booking.pickupPreparation;
    const earlierEta = String(preparation?.driverId) === String(booking.currentDriverId)
      && Number.isFinite(preparation?.route?.durationMinutes)
      ? preparation.route.durationMinutes : null;
    const leadMs = earlierEta === null ? ROUTE_CHECK_LEAD_MS
      : Math.max(ROUTE_CHECK_LEAD_MS, (Math.ceil(earlierEta) + 20) * MINUTE);
    if (now < pickupAt - leadMs || preparationIsFresh(preparation, booking.currentDriverId, now)) return null;
    title = 'Check your pickup route now';
    body = `${number}: open See Location for a fresh ETA before starting toward pickup.`;
  } else if (kind === 'DEPARTURE') {
    const preparation = booking.pickupPreparation;
    const fresh = preparationIsFresh(preparation, booking.currentDriverId, now);
    if (!fresh) return null;
    const eta = preparation.route.durationMinutes;
    const leadMs = (Math.ceil(eta) + 15) * MINUTE;
    if (now < pickupAt - leadMs) return null;
    title = 'Time to start toward pickup';
    body = `${number}: your route ETA plus the 15-minute buffer says to start now.`;
  } else return null;

  const driverId = String(booking.currentDriverId);
  return {
    key: `${booking._id}:${driverId}:${kind}:${pickupAt}`,
    driverId: booking.currentDriverId,
    bookingId: booking._id,
    kind,
    scheduledStartAt: booking.scheduledStartAt,
    title,
    body,
    expiresAt: new Date(pickupAt + 90 * 86400000),
  };
}

async function enqueueDueReminders(now) {
  const bookings = await Booking.find({
    timing: 'SCHEDULED',
    status: { $in: ['ASSIGNED', 'DRIVER_ACCEPTED'] },
    currentDriverId: { $ne: null },
    scheduledStartAt: { $gt: new Date(now), $lte: new Date(now + 6 * 60 * MINUTE) },
  }).sort({ scheduledStartAt: 1 }).limit(300).lean();
  for (const booking of bookings) {
    for (const kind of ['PREPARE', 'ROUTE_CHECK', 'DEPARTURE']) {
      const reminder = reminderToCreate(booking, kind, now);
      if (!reminder) continue;
      await DriverReminder.updateOne({ key: reminder.key }, { $setOnInsert: reminder }, { upsert: true });
    }
  }
}

function messaging() {
  if (!env.FIREBASE_PROJECT_ID) return null;
  if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId: env.FIREBASE_PROJECT_ID });
  return getMessaging();
}

async function sendReminder(reminder, now) {
  const driver = await Driver.findById(reminder.driverId).select('notificationPreferences').lean();
  if (driver?.notificationPreferences?.pushEnabled === false ||
      driver?.notificationPreferences?.scheduledRideReminders === false) {
    await DriverReminder.updateOne({ _id: reminder._id, status: 'CLAIMED' }, { $set: { status: 'OBSOLETE' } });
    return;
  }
  const booking = await Booking.findById(reminder.bookingId).select('currentDriverId timing status scheduledStartAt').lean();
  if (!booking || booking.timing !== 'SCHEDULED' ||
      !['ASSIGNED', 'DRIVER_ACCEPTED'].includes(booking.status) ||
      String(booking.currentDriverId) !== String(reminder.driverId) ||
      new Date(booking.scheduledStartAt).getTime() !== new Date(reminder.scheduledStartAt).getTime() ||
      new Date(booking.scheduledStartAt).getTime() <= now) {
    await DriverReminder.updateOne({ _id: reminder._id, status: 'CLAIMED' }, { $set: { status: 'OBSOLETE' } });
    return;
  }

  const sessions = await DriverSession.find({ driverId: reminder.driverId, revokedAt: null,
    expiresAt: { $gt: new Date(now) }, pushToken: { $exists: true, $ne: '' } })
    .select('+pushToken').limit(5).lean();
  const tokens = [...new Set(sessions.map((session) => session.pushToken))];
  let sent = false;
  const client = tokens.length ? messaging() : null;
  if (client) {
    for (const token of tokens) {
      try {
        await client.send({
          token,
          notification: { title: reminder.title, body: reminder.body },
          data: { type: 'SCHEDULED_RIDE_REMINDER', bookingId: String(reminder.bookingId), kind: reminder.kind },
          android: {
            priority: 'high',
            restrictedPackageName: 'com.rjstours.driver',
            ttl: Math.max(0, Math.min(new Date(booking.scheduledStartAt).getTime() - Date.now(),
              reminder.kind === 'PREPARE' ? 15 * MINUTE : 5 * MINUTE)),
            notification: { tag: reminder.key },
          },
        });
        sent = true;
      } catch (error) {
        if (['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(error.code)) {
          await DriverSession.updateMany({ pushToken: token }, { $unset: { pushToken: 1 } });
        } else {
          console.warn('Scheduled ride push delivery postponed', { reminderId: String(reminder._id), code: error.code || 'PUSH_UNAVAILABLE' });
        }
      }
    }
  }
  await DriverReminder.updateOne({ _id: reminder._id, status: 'CLAIMED' }, {
    $set: sent
      ? { status: 'SENT', sentAt: new Date(), claimExpiresAt: null }
      : { status: 'PENDING', nextAttemptAt: new Date(now + RETRY_MS), claimExpiresAt: null },
  });
}

export async function sweepDriverReminders(now = Date.now()) {
  await enqueueDueReminders(now);
  for (let i = 0; i < 100; i += 1) {
    const reminder = await DriverReminder.findOneAndUpdate({ $or: [
      { status: 'PENDING', nextAttemptAt: { $lte: new Date(now) } },
      { status: 'CLAIMED', claimExpiresAt: { $lte: new Date(now) } },
    ] }, { $set: { status: 'CLAIMED', claimExpiresAt: new Date(now + CLAIM_MS) }, $inc: { attempts: 1 } },
    { sort: { scheduledStartAt: 1 }, new: true });
    if (!reminder) break;
    try { await sendReminder(reminder, now); }
    catch (error) {
      console.warn('Scheduled ride reminder postponed', { reminderId: String(reminder._id), code: error.code || 'REMINDER_UNAVAILABLE' });
      await DriverReminder.updateOne({ _id: reminder._id, status: 'CLAIMED' }, { $set: {
        status: 'PENDING', nextAttemptAt: new Date(now + RETRY_MS), claimExpiresAt: null,
      } });
    }
  }
}

export function startDriverReminders() {
  let running;
  const run = () => {
    if (running) return;
    running = sweepDriverReminders().catch((error) => console.warn('Scheduled ride reminder sweep postponed', { code: error.code || 'SWEEP_UNAVAILABLE' }))
      .finally(() => { running = null; });
  };
  run();
  const timer = setInterval(run, MINUTE);
  timer.unref();
  return async () => { clearInterval(timer); await running; };
}

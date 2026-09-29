import { Booking } from '../bookings/booking.model.js';
import { CustomerReminder } from './customer-reminder.model.js';
import { sendCustomerPushMessage } from './customer-push.service.js';

const MINUTE = 60000;
const RETRY_MS = 2 * MINUTE;
const CLAIM_MS = 2 * MINUTE;
const eligibleStatuses = [
  'NEW', 'ASSIGNMENT_PENDING', 'ASSIGNED', 'DRIVER_ACCEPTED', 'DRIVER_EN_ROUTE', 'ARRIVED',
];

export function customerReminderToCreate(booking, kind, now = Date.now()) {
  const pickupAt = new Date(booking.scheduledStartAt).getTime();
  if (booking.timing !== 'SCHEDULED' || !booking.customerId ||
      !eligibleStatuses.includes(booking.status) || !Number.isFinite(pickupAt) || now >= pickupAt) return null;
  const lead = kind === 'ONE_HOUR' ? 60 : kind === 'FIFTEEN_MINUTES' ? 15 : null;
  if (!lead || now < pickupAt - lead * MINUTE) return null;
  const number = booking.bookingNumber || 'Your scheduled ride';
  const title = kind === 'ONE_HOUR' ? 'Scheduled ride in 1 hour' : 'Scheduled ride in 15 minutes';
  const body = kind === 'ONE_HOUR'
    ? `${number} is coming up. Review your pickup details and be ready.`
    : `${number} pickup is in about 15 minutes. Please be ready at the pickup point.`;
  return {
    key: `${booking._id}:${booking.customerId}:${kind}:${pickupAt}`,
    customerId: booking.customerId,
    bookingId: booking._id,
    bookingNumber: booking.bookingNumber,
    kind,
    scheduledStartAt: booking.scheduledStartAt,
    title,
    body,
    expiresAt: new Date(pickupAt + 30 * 86400000),
  };
}

async function enqueueDueReminders(now) {
  const bookings = await Booking.find({
    timing: 'SCHEDULED',
    status: { $in: eligibleStatuses },
    customerId: { $ne: null },
    scheduledStartAt: { $gt: new Date(now), $lte: new Date(now + 2 * 60 * MINUTE) },
  }).sort({ scheduledStartAt: 1 }).limit(300).lean();
  for (const booking of bookings) {
    for (const kind of ['ONE_HOUR', 'FIFTEEN_MINUTES']) {
      const reminder = customerReminderToCreate(booking, kind, now);
      if (reminder) await CustomerReminder.updateOne(
        { key: reminder.key }, { $setOnInsert: reminder }, { upsert: true },
      );
    }
  }
}

async function sendReminder(reminder, now) {
  const booking = await Booking.findById(reminder.bookingId)
    .select('customerId timing status scheduledStartAt').lean();
  if (!booking || booking.timing !== 'SCHEDULED' || !eligibleStatuses.includes(booking.status) ||
      String(booking.customerId) !== String(reminder.customerId) ||
      new Date(booking.scheduledStartAt).getTime() !== new Date(reminder.scheduledStartAt).getTime() ||
      new Date(booking.scheduledStartAt).getTime() <= now) {
    await CustomerReminder.updateOne({ _id: reminder._id, status: 'CLAIMED' }, { $set: { status: 'OBSOLETE' } });
    return;
  }
  const result = await sendCustomerPushMessage({
    customerId: reminder.customerId,
    title: reminder.title,
    body: reminder.body,
    tag: reminder.key,
    ttl: Math.min(new Date(booking.scheduledStartAt).getTime() - Date.now(), 15 * MINUTE),
    data: {
      type: 'SCHEDULED_RIDE_REMINDER',
      bookingId: reminder.bookingId,
      kind: reminder.kind,
    },
  });
  await CustomerReminder.updateOne({ _id: reminder._id, status: 'CLAIMED' }, {
    $set: result.sent > 0 || result.retryable === false
      ? { status: 'SENT', sentAt: new Date(), claimExpiresAt: null }
      : { status: 'PENDING', nextAttemptAt: new Date(now + RETRY_MS), claimExpiresAt: null },
  });
}

export async function sweepCustomerReminders(now = Date.now()) {
  await enqueueDueReminders(now);
  for (let index = 0; index < 100; index += 1) {
    const reminder = await CustomerReminder.findOneAndUpdate({ $or: [
      { status: 'PENDING', nextAttemptAt: { $lte: new Date(now) } },
      { status: 'CLAIMED', claimExpiresAt: { $lte: new Date(now) } },
    ] }, { $set: { status: 'CLAIMED', claimExpiresAt: new Date(now + CLAIM_MS) }, $inc: { attempts: 1 } },
    { sort: { scheduledStartAt: 1 }, new: true });
    if (!reminder) break;
    try { await sendReminder(reminder, now); }
    catch (error) {
      console.warn('Customer scheduled reminder postponed', {
        reminderId: String(reminder._id), code: error.code || 'REMINDER_UNAVAILABLE',
      });
      await CustomerReminder.updateOne({ _id: reminder._id, status: 'CLAIMED' }, { $set: {
        status: 'PENDING', nextAttemptAt: new Date(now + RETRY_MS), claimExpiresAt: null,
      } });
    }
  }
}

export function startCustomerReminders() {
  let running;
  const run = () => {
    if (running) return;
    running = sweepCustomerReminders()
      .catch((error) => console.warn('Customer reminder sweep postponed', { code: error.code || 'SWEEP_UNAVAILABLE' }))
      .finally(() => { running = null; });
  };
  run();
  const timer = setInterval(run, MINUTE);
  timer.unref();
  return async () => { clearInterval(timer); await running; };
}

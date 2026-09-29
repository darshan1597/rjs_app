import express from 'express';
import { z } from 'zod';

import { authenticateCustomer } from './customer-auth.middleware.js';
import { Booking } from '../bookings/booking.model.js';
import { CustomerSession } from './customer.model.js';
import { CustomerReminder } from './customer-reminder.model.js';

const router = express.Router();

const copy = {
  SEARCHING_DRIVER: ['Finding your driver', 'Your ride request is being shared with nearby drivers.'],
  NO_DRIVER_AVAILABLE: ['No driver available', 'No driver accepted this request. You can search again from your booking.'],
  ASSIGNED: ['Driver assigned', 'A driver has been assigned to your ride.'],
  DRIVER_ACCEPTED: ['Driver accepted your ride', 'Your driver has accepted and is preparing for pickup.'],
  DRIVER_EN_ROUTE: ['Driver is on the way', 'Track the driver live while they travel to your pickup.'],
  ARRIVED: ['Driver has arrived', 'Meet your driver at the pickup point and share the trip OTP.'],
  IN_PROGRESS: ['Trip started', 'Your ride is now in progress.'],
  PAYMENT_PENDING: ['Payment due', 'Your final ride bill is ready. Complete payment in the app or through the driver QR.'],
  COMPLETED: ['Ride completed', 'Payment is complete. Your receipt is available in My Rides.'],
  CANCELLED: ['Ride cancelled', 'This booking has been cancelled.'],
  NO_SHOW: ['Ride closed', 'The booking was closed as a customer no-show.'],
};

router.use(authenticateCustomer);

const deviceSchema = z.object({
  token: z.string().trim().min(20).max(4096),
  platform: z.enum(['android', 'ios']),
});

router.put('/device', async (req, res, next) => {
  try {
    const parsed = deviceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        error: { code: 'INVALID_PUSH_TOKEN', message: 'Invalid device registration' },
      });
    }
    const { token, platform } = parsed.data;
    await CustomerSession.updateMany(
      { _id: { $ne: req.customerSessionId }, pushToken: token },
      { $unset: { pushToken: 1, pushPlatform: 1 } },
    );
    await CustomerSession.updateOne(
      { _id: req.customerSessionId, customerId: req.customer._id, revokedAt: null },
      { $set: { pushToken: token, pushPlatform: platform } },
    );
    return res.json({ success: true, data: { registered: true } });
  } catch (error) {
    return next(error);
  }
});

router.delete('/device', async (req, res, next) => {
  try {
    await CustomerSession.updateOne(
      { _id: req.customerSessionId, customerId: req.customer._id },
      { $unset: { pushToken: 1, pushPlatform: 1 } },
    );
    return res.json({ success: true, data: { registered: false } });
  } catch (error) {
    return next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const [bookings, reminders] = await Promise.all([
      Booking.find({ customerId: req.customer._id })
        .select('bookingNumber statusHistory createdAt')
        .sort({ updatedAt: -1 })
        .limit(30)
        .lean(),
      CustomerReminder.find({ customerId: req.customer._id, status: { $ne: 'OBSOLETE' } })
        .sort({ createdAt: -1 }).limit(30).lean(),
    ]);
    const readAt = req.customer.notificationsReadAt;
    const bookingNotifications = bookings
      .flatMap((booking) => (booking.statusHistory || []).map((entry) => {
        const text = copy[entry.status];
        if (!text) return null;
        const createdAt = entry.changedAt || booking.createdAt;
        return {
          id: `${booking._id}:${entry._id}`,
          bookingId: String(booking._id),
          bookingNumber: booking.bookingNumber,
          status: entry.status,
          title: text[0],
          body: `${text[1]} (${booking.bookingNumber})`,
          createdAt,
          readAt: readAt && new Date(createdAt) <= readAt ? readAt : null,
        };
      }))
      .filter(Boolean);
    const reminderNotifications = reminders.map((reminder) => ({
      id: `reminder:${reminder._id}`,
      bookingId: String(reminder.bookingId),
      bookingNumber: reminder.bookingNumber,
      status: 'SCHEDULED_RIDE_REMINDER',
      title: reminder.title,
      body: reminder.body,
      createdAt: reminder.createdAt,
      readAt: readAt && new Date(reminder.createdAt) <= readAt ? readAt : null,
    }));
    const notifications = [...bookingNotifications, ...reminderNotifications]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 30);
    return res.json({
      success: true,
      data: {
        notifications,
        unreadCount: notifications.filter((item) => !item.readAt).length,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/read-all', async (req, res, next) => {
  try {
    req.customer.notificationsReadAt = new Date();
    await req.customer.save();
    return res.json({ success: true, data: { readAt: req.customer.notificationsReadAt } });
  } catch (error) {
    return next(error);
  }
});

export { router as customerNotificationRouter };

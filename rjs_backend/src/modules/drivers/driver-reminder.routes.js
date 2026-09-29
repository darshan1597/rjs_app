import express from 'express';
import { z } from 'zod';

import { authenticateDriver } from './driver-auth.middleware.js';
import { DriverSession } from './driver-auth.model.js';
import { DriverReminder } from './driver-reminder.model.js';

const router = express.Router();
router.use(authenticateDriver);

const deviceSchema = z.object({ token: z.string().trim().min(20).max(4096), platform: z.enum(['android', 'ios']) });

router.put('/device', async (req, res, next) => {
  try {
    const parsed = deviceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ success: false, error: { code: 'INVALID_PUSH_TOKEN', message: 'Invalid device registration' } });
    const { token, platform } = parsed.data;
    await DriverSession.updateMany({ _id: { $ne: req.driverSessionId }, pushToken: token }, { $unset: { pushToken: 1, pushPlatform: 1 } });
    await DriverSession.updateOne({ _id: req.driverSessionId, driverId: req.driver._id, revokedAt: null },
      { $set: { pushToken: token, pushPlatform: platform } });
    return res.json({ success: true, data: { registered: true } });
  } catch (error) { return next(error); }
});

router.delete('/device', async (req, res, next) => {
  try {
    await DriverSession.updateOne({ _id: req.driverSessionId, driverId: req.driver._id }, { $unset: { pushToken: 1, pushPlatform: 1 } });
    return res.json({ success: true, data: { registered: false } });
  } catch (error) { return next(error); }
});

router.get('/', async (req, res, next) => {
  try {
    const filter = { driverId: req.driver._id, status: { $ne: 'OBSOLETE' },
      scheduledStartAt: { $gt: new Date(Date.now() - 24 * 60 * 60000) } };
    const [reminders, unreadCount] = await Promise.all([
      DriverReminder.find(filter).sort({ createdAt: -1 }).limit(20)
        .select('bookingId kind title body createdAt sentAt readAt').lean(),
      DriverReminder.countDocuments({ ...filter, readAt: null }),
    ]);
    return res.json({ success: true, data: { reminders, unreadCount } });
  } catch (error) { return next(error); }
});

router.post('/read-all', async (req, res, next) => {
  try {
    await DriverReminder.updateMany({ driverId: req.driver._id, readAt: null }, { $set: { readAt: new Date() } });
    return res.json({ success: true, data: { updated: true } });
  } catch (error) { return next(error); }
});

export { router as driverReminderRouter };

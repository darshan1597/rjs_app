import express from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { AppError } from '../../common/errors/app-error.js';
import { validate } from '../../common/middleware/validate.js';
import { hashToken, signDriverAccessToken, signDriverRefreshToken, verifyDriverRefreshToken } from '../../common/security/tokens.js';
import { env } from '../../config/env.js';
import { DriverOtp, DriverSession } from './driver-auth.model.js';
import { authenticateDriver } from './driver-auth.middleware.js';
import { Driver } from './driver.model.js';
import { createOtpLimiters } from '../../common/middleware/rate-limits.js';
import { SupportTicket } from '../support/support-ticket.model.js';

const router = express.Router();
const otpLimits = createOtpLimiters();
router.post(['/request-otp', '/verify-otp'], otpLimits.ip);
const empty = z.object({});
const phone = z.string().trim().regex(/^\d{10}$/);
const requestSchema = z.object({ body: z.object({ phone }), params: empty, query: empty });
const verifySchema = z.object({ body: z.object({ phone, otp: z.string().regex(/^\d{6}$/) }), params: empty, query: empty });
const refreshSchema = z.object({ body: z.object({ refreshToken: z.string().min(20) }), params: empty, query: empty });
const notificationPreferencesSchema = z.object({
  body: z.object({
    pushEnabled: z.boolean(),
    scheduledRideReminders: z.boolean(),
    foregroundAlerts: z.boolean(),
  }),
  params: empty,
  query: empty,
});
const profileChangeRequestSchema = z.object({
  body: z.object({ area: z.enum(['PERSONAL', 'PHOTO', 'DOCUMENTS', 'VEHICLE', 'BANK']), details: z.string().trim().min(10).max(2000) }),
  params: empty,
  query: empty,
});

const safeDriver = (driver) => ({
  id: driver.id,
  driverCode: driver.driverCode,
  status: driver.status,
  operationalStatus: driver.operationalStatus,
  serviceAssignment: driver.serviceAssignment,
  notificationPreferences: driver.notificationPreferences,
  name: driver.personal.fullName,
  phone: driver.personal.phone,
  email: driver.personal.email,
  profilePhoto: driver.personal.profilePhoto,
  personal: {
    fullName: driver.personal.fullName,
    phone: driver.personal.phone,
    email: driver.personal.email,
    dateOfBirth: driver.personal.dateOfBirth,
    gender: driver.personal.gender,
    residentialAddress: driver.personal.residentialAddress,
    emergencyContact: driver.personal.emergencyContact,
    phoneVerifiedAt: driver.personal.phoneVerifiedAt,
  },
  licence: driver.licence,
  vehicle: driver.vehicle,
  documents: driver.documents,
  bank: {
    accountHolderName: driver.bank?.accountHolderName,
    accountNumber: `••••${driver.bank?.accountNumber?.slice(-4) || ''}`,
    ifscCode: driver.bank?.ifscCode,
    upiId: driver.bank?.upiId,
  },
  createdAt: driver.createdAt,
});

const driverPhoneQuery = (phoneNumber) => ({
  'personal.phone': { $in: [phoneNumber, `+91${phoneNumber}`, `91${phoneNumber}`] },
});

async function createSession(driver, req) {
  const session = await DriverSession.create({
    driverId: driver.id,
    refreshTokenHash: 'pending',
    expiresAt: new Date(Date.now() + env.DRIVER_SESSION_TTL_DAYS * 86400000),
    userAgent: req.get('user-agent'),
    ip: req.ip,
  });

  const refreshToken = signDriverRefreshToken(driver.id, session.id);

  session.refreshTokenHash = hashToken(refreshToken);

  await session.save();
  return {
    driver: safeDriver(driver),
    tokens: { accessToken: signDriverAccessToken(driver, session.id), refreshToken },
  };
}

router.post('/request-otp', validate(requestSchema), otpLimits.request, async (req, res, next) => {
  try {
    const phoneNumber = req.validated.body.phone;
    const normalized = `+91${phoneNumber}`;
    const driver = await Driver.findOne(driverPhoneQuery(phoneNumber));

    if (!driver) throw new AppError(404, 'DRIVER_NOT_REGISTERED', 'Visit an RJS office to register this number');

    if (driver.status !== 'ACTIVE') throw new AppError(403, 'DRIVER_NOT_ACTIVE', 'Your driver account is not active yet');

    await DriverOtp.updateMany({ phone: normalized, consumedAt: null }, { consumedAt: new Date() });

    const challenge = await DriverOtp.create({ phone: normalized, expiresAt: new Date(Date.now() + 5 * 60000) });

    return res.json({ success: true, data: { challengeId: challenge.id, expiresInSeconds: 300, ...env.NODE_ENV !== 'production' && { devOtp: env.DEV_FIXED_OTP } } });
  } catch (error) { 
    return next(error); 
  }
});

router.post('/verify-otp', validate(verifySchema), otpLimits.verify, async (req, res, next) => {
  try {
    const normalized = `+91${req.validated.body.phone}`;
    const challenge = await DriverOtp.findOne({ phone: normalized, consumedAt: null, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });

    if (!challenge) throw new AppError(400, 'OTP_EXPIRED', 'Request a new OTP');

    challenge.attempts += 1;

    if (challenge.attempts > 5) { 
      challenge.consumedAt = new Date(); 
      await challenge.save(); 
      throw new AppError(429, 'OTP_ATTEMPTS_EXCEEDED', 'Request a new OTP'); 
    }

    if (req.validated.body.otp !== env.DEV_FIXED_OTP) { 
      await challenge.save(); 
      throw new AppError(400, 'INVALID_OTP', 'The OTP is incorrect'); 
    }

    challenge.consumedAt = new Date(); await challenge.save();

    const driver = await Driver.findOne(driverPhoneQuery(req.validated.body.phone));

    if (!driver || driver.status !== 'ACTIVE') throw new AppError(403, 'DRIVER_UNAVAILABLE', 'The driver account is unavailable');

    return res.json({ success: true, data: await createSession(driver, req) });
  } catch (error) { 
    return next(error); 
  }
});

router.post('/refresh', validate(refreshSchema), async (req, res, next) => {
  try {
    const token = req.validated.body.refreshToken;
    let payload;

    try { 
      payload = verifyDriverRefreshToken(token); 
    } catch { 
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'The refresh token is invalid or expired'); 
    }

    const session = await DriverSession.findById(payload.sid).select('+refreshTokenHash');

    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.refreshTokenHash !== hashToken(token)) 
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'The refresh token is invalid or expired');

    const driver = await Driver.findById(payload.sub);

    if (!driver || driver.status !== 'ACTIVE') throw new AppError(403, 'DRIVER_UNAVAILABLE', 'The driver account is unavailable');

    const refreshToken = signDriverRefreshToken(driver.id, session.id);

    session.refreshTokenHash = hashToken(refreshToken); await session.save();

    return res.json({ success: true, data: { driver: safeDriver(driver), tokens: { accessToken: signDriverAccessToken(driver, session.id), refreshToken } } });
  } catch (error) { 
    return next(error); 
  }
});

router.get('/me', authenticateDriver, (req, res) => res.json({ 
  success: true, data: { driver: safeDriver(req.driver) } 
}));

router.patch('/notification-preferences', authenticateDriver, validate(notificationPreferencesSchema), async (req, res, next) => {
  try {
    req.driver.notificationPreferences = req.validated.body;
    await req.driver.save();
    return res.json({ success: true, data: { preferences: req.driver.notificationPreferences } });
  } catch (error) { return next(error); }
});

router.post('/profile-change-requests', authenticateDriver, validate(profileChangeRequestSchema), async (req, res, next) => {
  try {
    const { area, details } = req.validated.body;
    const ticket = await SupportTicket.create({
      ticketNumber: `DR-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`,
      requesterType: 'DRIVER',
      requesterName: req.driver.personal.fullName,
      requesterPhone: req.driver.personal.phone,
      requesterEmail: req.driver.personal.email,
      driverId: req.driver._id,
      profileChangeArea: area,
      subject: `${area} profile change request · ${req.driver.driverCode}`,
      category: 'DRIVER',
      priority: area === 'BANK' ? 'HIGH' : 'MEDIUM',
      messages: [{ senderType: 'DRIVER', senderName: req.driver.personal.fullName, text: details }],
    });
    return res.status(201).json({ success: true, data: { ticketNumber: ticket.ticketNumber, status: ticket.status } });
  } catch (error) { return next(error); }
});

router.get('/profile-change-requests', authenticateDriver, async (req, res, next) => {
  try {
    const requests = await SupportTicket.find({ driverId: req.driver._id, profileChangeArea: { $exists: true } })
      .sort({ createdAt: -1 }).limit(20).select('ticketNumber profileChangeArea status reviewDecision reviewNote reviewedAt createdAt messages').lean();
    return res.json({ success: true, data: { requests } });
  } catch (error) { return next(error); }
});

export { router as driverAuthRouter };

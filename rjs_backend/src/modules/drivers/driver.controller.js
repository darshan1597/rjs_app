import { writeAuditLog } from '../audit/audit.service.js';
import jwt from 'jsonwebtoken';
import { AppError } from '../../common/errors/app-error.js';
import { env } from '../../config/env.js';
import { DriverRegistrationOtp } from './driver-auth.model.js';
import { Driver } from './driver.model.js';
import { createDriver as createRecord, getDriverDetails as getDetails, listDrivers as listRecords, updateDriverStatus as updateStatus } from './driver.service.js';

async function listDrivers(req, res, next) {
  try {
    const result = await listRecords(req.validated.query);
    return res.json({ success: true, data: { items: result.items.map((item) => item.toSafeObject()), pagination: result.pagination } });
  } catch (error) { return next(error); }
}
async function createDriver(req, res, next) {
  try {
    const driver = await createRecord(req.validated.body, req.admin.id);
    await writeAuditLog({ req, action: 'driver.create', actor: req.admin, targetType: 'Driver', targetId: driver.id });
    return res.status(201).json({ success: true, data: driver.toSafeObject() });
  } catch (error) { return next(error); }
}
async function updateDriverStatus(req, res, next) {
  try {
    const driver = await updateStatus(req.validated.params.driverId, req.validated.body.status);
    await writeAuditLog({ req, action: 'driver.status.update', actor: req.admin, targetType: 'Driver', targetId: driver.id, metadata: req.validated.body });
    return res.json({ success: true, data: driver.toSafeObject() });
  } catch (error) { return next(error); }
}
async function getDriverDetails(req, res, next) {
  try { return res.json({ success: true, data: await getDetails(req.validated.params.driverId) }); }
  catch (error) { return next(error); }
}
const normalizePhone = (phone) => String(phone).replace(/\D/g, '').slice(-10);
async function requestPhoneVerification(req, res, next) {
  try {
    const phone = normalizePhone(req.validated.body.phone);
    const existing = await Driver.exists({ 'personal.phone': { $in: [phone, `+91${phone}`, `91${phone}`] } });
    if (existing) throw new AppError(409, 'DRIVER_PHONE_EXISTS', 'A driver is already registered with this phone number');
    await DriverRegistrationOtp.updateMany({ phone, consumedAt: null }, { consumedAt: new Date() });
    const challenge = await DriverRegistrationOtp.create({ phone, requestedBy: req.admin.id, expiresAt: new Date(Date.now() + 5 * 60000) });
    return res.json({ success: true, data: { challengeId: challenge.id, expiresInSeconds: 300, ...env.NODE_ENV !== 'production' && { devOtp: env.DEV_FIXED_OTP } } });
  } catch (error) { return next(error); }
}
async function confirmPhoneVerification(req, res, next) {
  try {
    const phone = normalizePhone(req.validated.body.phone);
    const challenge = await DriverRegistrationOtp.findOne({ phone, requestedBy: req.admin.id, consumedAt: null, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
    if (!challenge) throw new AppError(400, 'OTP_EXPIRED', 'Request a new OTP');
    challenge.attempts += 1;
    if (challenge.attempts > 5) { challenge.consumedAt = new Date(); await challenge.save(); throw new AppError(429, 'OTP_ATTEMPTS_EXCEEDED', 'Too many attempts. Request a new OTP'); }
    if (req.validated.body.otp !== env.DEV_FIXED_OTP) { await challenge.save(); throw new AppError(400, 'INVALID_OTP', 'The OTP is incorrect'); }
    challenge.consumedAt = new Date(); await challenge.save();
    const verificationToken = jwt.sign({ phone, adminId: req.admin.id, purpose: 'driver_phone_verification' }, env.ACCESS_TOKEN_SECRET, { expiresIn: '2h', issuer: 'rjs-backend', audience: 'rjs-driver-registration' });
    return res.json({ success: true, data: { verificationToken, phone } });
  } catch (error) { return next(error); }
}
export { confirmPhoneVerification, createDriver, getDriverDetails, listDrivers, requestPhoneVerification, updateDriverStatus };

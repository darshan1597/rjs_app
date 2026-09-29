import { AppError } from '../../common/errors/app-error.js';
import { Driver } from './driver.model.js';
import { Booking } from '../bookings/booking.model.js';
import { DriverPayout } from '../payments/payment.model.js';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { VehicleCategory, VehicleVariant } from '../vehicles/vehicle.model.js';
import { SupportTicket } from '../support/support-ticket.model.js';

async function listDrivers({ page, limit, search, status, vehicleType }) {
  const filter = {};
  if (status) filter.status = status;
  if (vehicleType) filter['vehicle.categoryId'] = vehicleType;
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { 'personal.fullName': { $regex: escaped, $options: 'i' } }, { 'personal.phone': { $regex: escaped, $options: 'i' } },
      { driverCode: { $regex: escaped, $options: 'i' } }, { 'vehicle.registrationNumber': { $regex: escaped, $options: 'i' } },
    ];
  }
  const [items, total] = await Promise.all([
    Driver.find(filter).populate('vehicle.categoryId', 'name code photoUrl').populate('vehicle.variantId', 'name code photoUrl onRoadPrice').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), Driver.countDocuments(filter),
  ]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function createDriver(data, creatorId) {
  let verification;
  try {
    verification = jwt.verify(data.phoneVerificationToken, env.ACCESS_TOKEN_SECRET, { issuer: 'rjs-backend', audience: 'rjs-driver-registration' });
  } catch (_) {
    throw new AppError(400, 'PHONE_VERIFICATION_REQUIRED', 'Verify the driver phone number again');
  }

  const phone = String(data.personal.phone).replace(/\D/g, '').slice(-10);

  if (verification.purpose !== 'driver_phone_verification' || verification.phone !== phone || String(verification.adminId) !== String(creatorId)) {
    throw new AppError(400, 'PHONE_VERIFICATION_MISMATCH', 'The verified phone number does not match the driver phone number');
  }

  delete data.phoneVerificationToken;

  const [category, variant] = await Promise.all([
    VehicleCategory.findOne({ _id: data.vehicle.categoryId, isActive: true }),
    VehicleVariant.findOne({ _id: data.vehicle.variantId, categoryId: data.vehicle.categoryId, isActive: true }),
  ]);

  if (!category || !variant) throw new AppError(422, 'VEHICLE_UNAVAILABLE', 'Choose an active vehicle category and variant');

  data.vehicle.category = category.code;
  data.vehicle.variant = variant.code;
  data.vehicle.masterPhoto = variant.photoUrl;
  data.personal.phoneVerifiedAt = new Date();

  const duplicate = await Driver.findOne({ $or: [
    { 'personal.phone': data.personal.phone }, { 'licence.number': data.licence.number.toUpperCase() },
    { 'vehicle.registrationNumber': data.vehicle.registrationNumber.toUpperCase() },
  ] });

  if (duplicate) throw new AppError(409, 'DRIVER_ALREADY_EXISTS', 'A driver, licence, or vehicle with these details already exists');

  return Driver.create({ ...data, createdBy: creatorId });
}

async function updateDriverStatus(driverId, status) {
  const driver = await Driver.findByIdAndUpdate(driverId, { status }, { new: true, runValidators: true });
  if (!driver) throw new AppError(404, 'DRIVER_NOT_FOUND', 'Driver was not found');
  return driver;
}

async function getDriverDetails(driverId) {
  const driver = await Driver.findById(driverId).populate('vehicle.categoryId', 'name code photoUrl').populate('vehicle.variantId', 'name code photoUrl onRoadPrice').lean();

  if (!driver) throw new AppError(404, 'DRIVER_NOT_FOUND', 'Driver was not found');
  
  const [bookings, payoutSummary, profileChangeRequests] = await Promise.all([
    Booking.find({ currentDriverId: driverId }).sort({ scheduledStartAt: -1 }).limit(12).select('bookingNumber serviceType pickup destination packageName scheduledStartAt scheduledEndAt status passengerCount').lean(),
    DriverPayout.aggregate([{ $match: { driverId: driver._id } }, { $group: { _id: null, totalPaid: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$netPayout', 0] } }, pendingPayout: { $sum: { $cond: [{ $in: ['$status', ['PENDING', 'PROCESSING']] }, '$netPayout', 0] } }, completedTrips: { $sum: '$completedTrips' } } }]),
    SupportTicket.find({ driverId: driver._id, profileChangeArea: { $exists: true } }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);
  return {
    ...driver,
    bank: { accountHolderName: driver.bank?.accountHolderName, accountNumber: `••••${driver.bank?.accountNumber?.slice(-4) || ''}`, ifscCode: driver.bank?.ifscCode, upiId: driver.bank?.upiId, proofFileName: driver.bank?.proofFileName, proofUrl: driver.bank?.proofUrl },
    bookings,
    earnings: payoutSummary[0] || { totalPaid: 0, pendingPayout: 0, completedTrips: 0 },
    profileChangeRequests,
  };
}

async function reviewDriverChange(driverId, requestId, data, adminId) {
  const request = await SupportTicket.findOne({ _id: requestId, driverId, profileChangeArea: { $exists: true }, reviewDecision: { $exists: false } });
  if (!request) throw new AppError(404, 'PROFILE_CHANGE_REQUEST_NOT_FOUND', 'Pending profile change request was not found');
  if (data.decision === 'APPROVED') {
    const updates = data.updates || {};
    const set = {};
    const area = request.profileChangeArea;
    if (area === 'PERSONAL' && updates.personal) for (const [key, value] of Object.entries(updates.personal)) set[`personal.${key}`] = value;
    if (area === 'BANK' && updates.bank) for (const [key, value] of Object.entries(updates.bank)) set[`bank.${key}`] = value;
    if (area === 'VEHICLE' && updates.vehicle) for (const [key, value] of Object.entries(updates.vehicle)) set[`vehicle.${key}`] = value;
    if (area === 'PHOTO' && updates.profilePhoto) set['personal.profilePhoto'] = updates.profilePhoto;
    if (area === 'DOCUMENTS' && updates.documents) set.documents = updates.documents;
    if (!Object.keys(set).length) throw new AppError(422, 'PROFILE_CHANGE_VALUES_REQUIRED', 'Enter the approved replacement values before approving');
    const driver = await Driver.findByIdAndUpdate(driverId, { $set: set }, { new: true, runValidators: true });
    if (!driver) throw new AppError(404, 'DRIVER_NOT_FOUND', 'Driver was not found');
  }
  request.reviewDecision = data.decision;
  request.reviewNote = data.note;
  request.reviewedAt = new Date();
  request.reviewedBy = adminId;
  request.status = data.decision === 'APPROVED' ? 'RESOLVED' : 'CLOSED';
  request.messages.push({ senderType: 'EMPLOYEE', text: data.note });
  await request.save();
  return request;
}

export { createDriver, getDriverDetails, listDrivers, reviewDriverChange, updateDriverStatus };

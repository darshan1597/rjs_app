import { AppError } from '../../common/errors/app-error.js';
import { Driver } from '../drivers/driver.model.js';
import { Booking } from './booking.model.js';
import { Payment, Refund } from '../payments/payment.model.js';

async function listBookings({ page, limit, search, status, serviceType, paymentStatus }) {
  const filter = {};
  if (status) filter.status = status;
  if (serviceType) filter.serviceType = serviceType;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (search) { const value = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); filter.$or = [{ bookingNumber: { $regex: value, $options: 'i' } }, { 'customer.name': { $regex: value, $options: 'i' } }, { 'customer.phone': { $regex: value, $options: 'i' } }, { 'pickup.address': { $regex: value, $options: 'i' } }]; }
  const [items, total, statuses] = await Promise.all([
    Booking.find(filter).populate('currentDriverId', 'driverCode personal.fullName personal.phone vehicle').sort({ scheduledStartAt: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Booking.countDocuments(filter), Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  return { items, summary: Object.fromEntries(statuses.map((row) => [row._id, row.count])), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}
async function eligibleDrivers(bookingId) {
  const booking = await Booking.findById(bookingId).lean();
  if (!booking) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking was not found');
  const busyIds = await Booking.distinct('currentDriverId', { _id: { $ne: booking._id }, currentDriverId: { $ne: null }, status: { $nin: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] }, scheduledStartAt: { $lt: booking.scheduledEndAt }, scheduledEndAt: { $gt: booking.scheduledStartAt } });
  const drivers = await Driver.find({ _id: { $nin: busyIds }, status: 'ACTIVE', 'vehicle.category': booking.requestedVehicleType, 'vehicle.seatingCapacity': { $gte: booking.passengerCount }, 'licence.expiryDate': { $gte: booking.scheduledEndAt } }).select('driverCode personal.fullName personal.phone vehicle licence.expiryDate').lean();
  return { booking, drivers };
}
async function assignDriver(bookingId, driverId, employeeId, reason) {
  const { booking, drivers } = await eligibleDrivers(bookingId);
  const driver = drivers.find((item) => String(item._id) === driverId);
  if (!driver) throw new AppError(409, 'DRIVER_NOT_ELIGIBLE', 'This driver is unavailable or does not match the booking');
  const updated = await Booking.findOneAndUpdate({ _id: bookingId, updatedAt: booking.updatedAt }, { $set: { currentDriverId: driverId, status: 'ASSIGNED' }, $push: { assignments: { driverId, vehicleRegistrationNumber: driver.vehicle.registrationNumber, assignedBy: employeeId, reason, method: 'MANUAL' } } }, { new: true, runValidators: true }).populate('currentDriverId', 'driverCode personal.fullName personal.phone vehicle');
  if (!updated) throw new AppError(409, 'BOOKING_CHANGED', 'The booking changed while assigning. Refresh and try again');
  return updated;
}
async function getBookingDetails(bookingId) { const booking=await Booking.findById(bookingId).populate('currentDriverId','driverCode personal.fullName personal.phone vehicle operationalStatus').populate('assignments.driverId','driverCode personal.fullName vehicle').lean();if(!booking)throw new AppError(404,'BOOKING_NOT_FOUND','Booking was not found');const[payment,refunds]=await Promise.all([Payment.findOne({bookingId}).sort({createdAt:-1}).lean(),Refund.find({bookingId}).sort({createdAt:-1}).lean()]);return{booking,payment,refunds}; }
async function addBookingNote(bookingId,text,admin){const booking=await Booking.findByIdAndUpdate(bookingId,{$push:{internalNotes:{text,authorId:admin.id,authorName:admin.name}}},{new:true});if(!booking)throw new AppError(404,'BOOKING_NOT_FOUND','Booking was not found');return booking.internalNotes.at(-1);}
export { addBookingNote, assignDriver, eligibleDrivers, getBookingDetails, listBookings };

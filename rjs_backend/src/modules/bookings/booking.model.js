import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  vehicleRegistrationNumber: { type: String, required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminAccount' },
  assignedAt: { type: Date, default: Date.now },
  endedAt: Date,
  reason: String,
  method: { type: String, enum: ['AUTOMATIC', 'MANUAL'], required: true },
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  bookingNumber: { type: String, unique: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', index: true },
  customer: { name: { type: String, required: true }, phone: { type: String, required: true } },
  serviceType: { type: String, enum: ['IMMEDIATE_RIDE', 'SCHEDULED_RIDE', 'CITY_ROUND_TRIP', 'RENTAL_PACKAGE', 'TOUR_PACKAGE'], required: true, index: true },
  timing: { type: String, enum: ['IMMEDIATE', 'SCHEDULED'], required: true },
  pickup: { address: { type: String, required: true }, latitude: Number, longitude: Number },
  destination: { address: String, latitude: Number, longitude: Number },
  packageName: String, durationMinutes: Number, estimatedDistanceKm: Number,
  passengerCount: { type: Number, min: 1, default: 1 },
  requestedVehicleType: { type: String, enum: ['AUTO', 'CAR', 'TEMPO_TRAVELLER', 'BUS'], required: true },
  requestedVehicleVariant: { type: String, enum: ['AUTO', 'HATCHBACK', 'SEDAN', 'SUV', 'TEMPO_TRAVELLER'] },
  scheduledStartAt: { type: Date, required: true, index: true },
  scheduledEndAt: { type: Date, required: true, index: true },
  assignmentMode: { type: String, enum: ['AUTOMATIC', 'MANUAL'], required: true },
  assignmentDeadline: Date,
  status: { type: String, enum: ['NEW', 'SEARCHING_DRIVER', 'DRIVER_ACCEPTED', 'AWAITING_PAYMENT', 'PAYMENT_CONFIRMED', 'ASSIGNMENT_PENDING', 'ASSIGNED', 'DRIVER_EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_DRIVER_AVAILABLE', 'NO_SHOW'], default: 'NEW', index: true },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'REFUNDED', 'FAILED'], default: 'PENDING' },
  paymentMethod: { type: String, enum: ['UPI', 'CARD', 'NET_BANKING', 'WALLET'] },
  totalAmount: { type: Number, min: 0, default: 0 },
  currentDriverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', index: true },
  rejectedDriverIds: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Driver' }], default: [] },
  assignments: { type: [assignmentSchema], default: [] },
  internalNotes: { type: [{ text: { type: String, required: true }, authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminAccount' }, authorName: String, createdAt: { type: Date, default: Date.now } }], default: [] },
  statusHistory: { type: [{ status: String, changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminAccount' }, changedAt: { type: Date, default: Date.now }, note: String }], default: [] },
  tripStartOtp: { type: String, select: false },
  arrivedAt: Date,
  startedAt: Date,
  completedAt: Date,
}, { timestamps: true });

bookingSchema.pre('validate', async function prepareBooking() {
  if (!this.bookingNumber) this.bookingNumber = `RJS${Date.now().toString().slice(-8)}`;
  const automatic = this.timing === 'IMMEDIATE' && ['IMMEDIATE_RIDE', 'CITY_ROUND_TRIP'].includes(this.serviceType);
  this.assignmentMode = automatic ? 'AUTOMATIC' : 'MANUAL';
  if (!automatic && !this.assignmentDeadline) this.assignmentDeadline = new Date(this.scheduledStartAt.getTime() - 6 * 60 * 60 * 1000);
  if (this.paymentStatus === 'PAID' && !this.currentDriverId && ['NEW', 'PAYMENT_CONFIRMED'].includes(this.status)) this.status = 'ASSIGNMENT_PENDING';
});

const Booking = mongoose.model('Booking', bookingSchema);
export { Booking };

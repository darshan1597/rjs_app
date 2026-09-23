import mongoose from 'mongoose';

const driverReminderSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true, index: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  kind: { type: String, enum: ['PREPARE', 'ROUTE_CHECK', 'DEPARTURE'], required: true },
  scheduledStartAt: { type: Date, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'CLAIMED', 'SENT', 'OBSOLETE'], default: 'PENDING', index: true },
  nextAttemptAt: { type: Date, default: Date.now },
  claimExpiresAt: Date,
  attempts: { type: Number, default: 0 },
  sentAt: Date,
  readAt: Date,
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

driverReminderSchema.index({ driverId: 1, createdAt: -1 });

export const DriverReminder = mongoose.model('DriverReminder', driverReminderSchema);

import mongoose from 'mongoose';

const customerReminderSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  bookingNumber: String,
  kind: { type: String, enum: ['ONE_HOUR', 'FIFTEEN_MINUTES'], required: true },
  scheduledStartAt: { type: Date, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'CLAIMED', 'SENT', 'OBSOLETE'], default: 'PENDING', index: true },
  nextAttemptAt: { type: Date, default: Date.now },
  claimExpiresAt: Date,
  attempts: { type: Number, default: 0 },
  sentAt: Date,
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

customerReminderSchema.index({ customerId: 1, createdAt: -1 });

export const CustomerReminder = mongoose.model('CustomerReminder', customerReminderSchema);

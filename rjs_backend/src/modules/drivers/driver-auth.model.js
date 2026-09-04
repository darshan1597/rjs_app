import mongoose from 'mongoose';

const driverOtpSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  attempts: { type: Number, default: 0 },
  consumedAt: Date,
}, { timestamps: true });

const driverSessionSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true, index: true },
  refreshTokenHash: { type: String, required: true, select: false },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  revokedAt: Date,
  userAgent: String,
  ip: String,
}, { timestamps: true });

const driverRegistrationOtpSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  attempts: { type: Number, default: 0 },
  consumedAt: Date,
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminAccount', required: true },
}, { timestamps: true });

const DriverOtp = mongoose.model('DriverOtp', driverOtpSchema);
const DriverSession = mongoose.model('DriverSession', driverSessionSchema);
const DriverRegistrationOtp = mongoose.model('DriverRegistrationOtp', driverRegistrationOtpSchema);
export { DriverOtp, DriverRegistrationOtp, DriverSession };

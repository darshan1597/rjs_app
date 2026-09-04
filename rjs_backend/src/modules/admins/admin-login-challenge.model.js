import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminAccount', required: true, index: true },
  purpose: { type: String, enum: ['MFA_SETUP', 'MFA_VERIFY'], required: true },
  attempts: { type: Number, default: 0 },
  consumedAt: Date,
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

const AdminLoginChallenge = mongoose.model('AdminLoginChallenge', schema);
export { AdminLoginChallenge };

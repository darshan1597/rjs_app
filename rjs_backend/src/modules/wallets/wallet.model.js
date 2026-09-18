import mongoose from 'mongoose';
const integer = { type: Number, required: true, min: 0, validate: Number.isSafeInteger };
const walletSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, unique: true },
  balancePaise: { ...integer, default: 0 },
}, { timestamps: true });
const topupSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  retryKey: { type: String, required: true },
  amountPaise: integer,
  orderId: { type: String, unique: true, sparse: true },
  paymentId: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ['PENDING', 'CREDITED'], default: 'PENDING' },
  lastOpenedAt: Date,
  lastCheckedAt: Date,
  archivedAt: Date,
  archiveReason: { type: String, enum: ['FAILED_ATTEMPTS', 'ABANDONED'] },
}, { timestamps: true });
topupSchema.index({ customerId: 1, retryKey: 1 }, { unique: true });
topupSchema.index({ status: 1, lastCheckedAt: 1, createdAt: 1 });
const ledgerSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  reference: { type: String, required: true, unique: true },
  type: { type: String, enum: ['TOPUP', 'RIDE_PAYMENT'], required: true },
  amountPaise: integer,
  balanceAfterPaise: integer,
  discountPaise: { ...integer, default: 0 },
  description: String,
}, { timestamps: true });
export const Wallet = mongoose.model('Wallet', walletSchema);
export const WalletTopup = mongoose.model('WalletTopup', topupSchema);
export const WalletLedger = mongoose.model('WalletLedger', ledgerSchema);

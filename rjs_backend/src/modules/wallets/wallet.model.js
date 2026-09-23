import mongoose from 'mongoose';
const integer = { type: Number, required: true, min: 0, validate: Number.isSafeInteger };
const walletSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, unique: true },
  balancePaise: { ...integer, default: 0 },
  withdrawablePaise: { ...integer, default: 0 },
  restrictedPaise: { ...integer, default: 0 },
  balanceVersion: Number,
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
  type: { type: String, enum: ['TOPUP', 'RIDE_PAYMENT', 'ADMIN_CREDIT', 'ADMIN_DEBIT', 'REFUND_CREDIT', 'WITHDRAWAL_HOLD', 'WITHDRAWAL_RELEASE'], required: true },
  amountPaise: integer,
  balanceAfterPaise: integer,
  withdrawableDeltaPaise: { type: Number, default: 0, validate: Number.isSafeInteger },
  restrictedDeltaPaise: { type: Number, default: 0, validate: Number.isSafeInteger },
  discountPaise: { ...integer, default: 0 },
  description: String,
}, { timestamps: true });
export const Wallet = mongoose.model('Wallet', walletSchema);
export const WalletTopup = mongoose.model('WalletTopup', topupSchema);
export const WalletLedger = mongoose.model('WalletLedger', ledgerSchema);

const adjustmentSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminAccount', required: true, index: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminAccount' },
  idempotencyKey: { type: String, required: true },
  type: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
  amountPaise: integer,
  reason: { type: String, required: true, trim: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING', index: true },
  reviewNote: { type: String, trim: true },
  balanceBeforePaise: { type: Number, min: 0, validate: Number.isSafeInteger },
  balanceAfterPaise: { type: Number, min: 0, validate: Number.isSafeInteger },
  reviewedAt: Date,
  requestIp: String,
  requestUserAgent: String,
  reviewIp: String,
  reviewUserAgent: String,
}, { timestamps: true });
adjustmentSchema.index({ requestedBy: 1, idempotencyKey: 1 }, { unique: true });
export const WalletAdjustment = mongoose.model('WalletAdjustment', adjustmentSchema);

const walletEventSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  type: { type: String, enum: ['CREDIT_CELEBRATION'], required: true },
  amountPaise: integer,
  title: { type: String, required: true, trim: true },
  sourceType: { type: String, enum: ['ADMIN_CREDIT', 'REFUND'], required: true },
  sourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  seenAt: Date,
}, { timestamps: true });
walletEventSchema.index({ sourceType: 1, sourceId: 1 }, { unique: true });
walletEventSchema.index({ customerId: 1, seenAt: 1, createdAt: 1 });
export const WalletEvent = mongoose.model('WalletEvent', walletEventSchema);

const walletWithdrawalSchema = new mongoose.Schema({
  withdrawalId: { type: String, required: true, unique: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  amountPaise: integer,
  vpa: { type: String, required: true, trim: true, lowercase: true },
  idempotencyKey: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'PROCESSING', 'PAID', 'REJECTED', 'FAILED', 'REVERSED'], default: 'PENDING', index: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminAccount' },
  reviewedAt: Date,
  reviewNote: String,
  gatewayPayoutId: { type: String, unique: true, sparse: true },
  utr: String,
  failureReason: String,
  completedAt: Date,
}, { timestamps: true });
walletWithdrawalSchema.index({ customerId: 1, idempotencyKey: 1 }, { unique: true });
walletWithdrawalSchema.index({ customerId: 1, status: 1 });
export const WalletWithdrawal = mongoose.model('WalletWithdrawal', walletWithdrawalSchema);

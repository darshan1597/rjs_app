import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  fileName: { 
    type: String, 
    trim: true 
  },
  url: { 
    type: String, 
    trim: true 
  },
}, { _id: false });

const driverSchema = new mongoose.Schema({
  driverCode: { 
    type: String, 
    unique: true, 
    index: true 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'ACTIVE', 'SUSPENDED'], 
    default: 'PENDING', 
    index: true 
  },
  operationalStatus: { 
    type: String, 
    enum: ['ONLINE', 'ON_TRIP', 'OFFLINE'],
    default: 'OFFLINE', 
    index: true 
  },
  currentLocation: {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    accuracyMetres: { type: Number, min: 0 },
    heading: { type: Number, min: 0, max: 360 },
    speedMetresPerSecond: { type: Number, min: 0 },
    recordedAt: Date,
  },
  serviceAssignment: { 
    type: String, 
    enum: ['LOCAL', 'OUTSTATION', 'FLEXIBLE'], 
    required: true, 
    default: 'FLEXIBLE', 
    index: true 
  },
  personal: {
    fullName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    phone: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true, 
      index: true 
    },
    dateOfBirth: { 
      type: Date, 
      required: true 
    },
    gender: { 
      type: String, 
      enum: ['MALE', 'FEMALE', 'OTHER'], 
      required: true 
    },
    email: { 
      type: String, 
      trim: true, 
      lowercase: true 
    },
    residentialAddress: { 
      type: String, 
      required: true, 
      trim: true 
    },
    emergencyContact: { 
      type: String, 
      required: true, 
      trim: true 
    },
    profilePhoto: String,
    phoneVerifiedAt: Date,
  },
  licence: {
    number: { 
      type: String, 
      required: true, 
      unique: true, 
      uppercase: true, 
      trim: true, 
      index: true 
    },
    issueDate: { 
      type: Date, 
      required: true 
    },
    expiryDate: { 
      type: Date, 
      required: true 
    },
    issuingState: { 
      type: String, 
      required: true, 
      trim: true 
    },
    frontFileName: String,
    backFileName: String,
    frontUrl: String,
    backUrl: String,
  },
  vehicle: {
    categoryId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'VehicleCategory', 
      required: true, 
      index: true 
    },
    variantId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'VehicleVariant', 
      required: true, 
      index: true 
    },
    category: { 
      type: String, 
      required: true 
    },
    variant: { 
      type: String, 
      required: true 
    },
    masterPhoto: String,
    registrationNumber: { 
      type: String, 
      required: true, 
      unique: true, 
      uppercase: true, 
      trim: true, 
      index: true 
    },
    manufacturer: { 
      type: String, 
      required: true, 
      trim: true 
    },
    model: { 
      type: String, 
      required: true, 
      trim: true 
    },
    fuelType: { 
      type: String, 
      required: true, 
      trim: true 
    },
    color: { 
      type: String, 
      required: true, 
      trim: true 
    },
    ownershipType: { 
      type: String, 
      enum: ['RJS_OWNED', 'DRIVER_OWNED', 'THIRD_PARTY'], 
      required: true 
    },
    seatingCapacity: { 
      type: Number, 
      required: true, 
      min: 1 
    },
    manufacturingYear: { 
      type: Number, 
      required: true 
    },
    frontPhoto: String,
    rearPhoto: String,
  },
  documents: { 
    type: [documentSchema], 
    default: [] 
  },
  bank: {
    accountHolderName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    accountNumber: { 
      type: String, 
      required: true, 
      trim: true 
    },
    ifscCode: { 
      type: String, 
      required: true, 
      uppercase: true, 
      trim: true 
    },
    upiId: { 
      type: String, 
      trim: true 
    },
    proofFileName: String,
    proofUrl: String,
  },
  consentAccepted: { 
    type: Boolean, 
    required: true 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AdminAccount', 
    required: true 
  },
}, { timestamps: true });

driverSchema.pre('save', async function assignCode() {
  if (this.driverCode) return;
  const sequence = await mongoose.model('Driver').countDocuments();
  this.driverCode = `RJD${String(sequence + 1).padStart(5, '0')}`;
});

driverSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this.id,
    driverCode: this.driverCode, 
    status: this.status, 
    operationalStatus: this.operationalStatus,
    serviceAssignment: this.serviceAssignment,
    currentLocation: this.currentLocation,
    personal: this.personal, 
    licence: this.licence, 
    vehicle: this.vehicle,
    documents: this.documents, 
    bank: { ...this.bank?.toObject?.(), accountNumber: `••••${this.bank?.accountNumber?.slice(-4) || ''}` },
    createdAt: this.createdAt, updatedAt: this.updatedAt,
  };
};

const Driver = mongoose.model('Driver', driverSchema);
export { Driver };

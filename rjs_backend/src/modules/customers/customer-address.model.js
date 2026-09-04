import mongoose from 'mongoose';

const customerAddressSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['HOME', 'WORK', 'FAVORITE'],
      required: true,
    },
    label: { type: String, trim: true, maxlength: 60 },
    addressLine: { type: String, required: true, trim: true, maxlength: 300 },
    landmark: { type: String, trim: true, maxlength: 120 },
    city: { type: String, trim: true, maxlength: 80, default: 'Bengaluru' },
    pincode: { type: String, trim: true, maxlength: 10 },
    location: {
      latitude: Number,
      longitude: Number,
    },
  },
  { timestamps: true },
);

customerAddressSchema.index(
  { customerId: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { type: { $in: ['HOME', 'WORK'] } },
  },
);

const CustomerAddress = mongoose.model('CustomerAddress', customerAddressSchema);

export { CustomerAddress };

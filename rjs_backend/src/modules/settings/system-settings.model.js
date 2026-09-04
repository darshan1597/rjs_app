import mongoose from 'mongoose';
const appControlSchema = new mongoose.Schema({
  status: { type: String, enum: ['ACTIVE', 'MAINTENANCE'], default: 'ACTIVE' },
  maintenanceMessage: { type: String, trim: true, maxlength: 300, default: '' },
  minimumVersion: { type: String, trim: true, default: '1.0.0' },
  forceUpdate: { type: Boolean, default: false },
}, { _id: false });
const schema = new mongoose.Schema({
  singletonKey: { type: String, unique: true, default: 'GLOBAL' },
  company: {
    businessName: { type: String, trim: true, default: 'RJS Tours' }, supportEmail: { type: String, trim: true, lowercase: true, default: '' },
    supportPhone: { type: String, trim: true, default: '' }, headOfficeAddress: { type: String, trim: true, default: '' }, logoUrl: { type: String, trim: true, default: '' },
  },
  security: { employeeLoginBlocked: { type: Boolean, default: false } },
  apps: { customer: { type: appControlSchema, default: () => ({}) }, driver: { type: appControlSchema, default: () => ({}) } },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminAccount' },
}, { timestamps: true, versionKey: false });
const SystemSettings = mongoose.model('SystemSettings', schema);
export { SystemSettings };

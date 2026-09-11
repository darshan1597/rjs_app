import mongoose from 'mongoose';

const common = {
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  photoUrl: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminAccount' },
};
const vehicleCategorySchema = new mongoose.Schema(common, { timestamps: true });
vehicleCategorySchema.index({ name: 1 }, { unique: true });
vehicleCategorySchema.index({ code: 1 }, { unique: true });
const vehicleVariantSchema = new mongoose.Schema({
  ...common,
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleCategory', required: true, index: true },
  onRoadPrice: { type: Number, required: true, min: 1 },
}, { timestamps: true });
vehicleVariantSchema.index({ categoryId: 1, name: 1 }, { unique: true });
vehicleVariantSchema.index({ categoryId: 1, code: 1 }, { unique: true });
const VehicleCategory = mongoose.model('VehicleCategory', vehicleCategorySchema);
const VehicleVariant = mongoose.model('VehicleVariant', vehicleVariantSchema);
export { VehicleCategory, VehicleVariant };

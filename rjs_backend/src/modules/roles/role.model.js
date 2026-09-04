import mongoose from 'mongoose';
import { PERMISSIONS } from './permission-catalog.js';

const schema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '', trim: true },
  permissions: [{ type: String, enum: PERMISSIONS }],
  isSystem: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminAccount' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminAccount' },
}, { timestamps: true });

const Role = mongoose.model('Role', schema);
export { Role };

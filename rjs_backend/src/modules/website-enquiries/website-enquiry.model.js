import crypto from 'node:crypto';
import mongoose from 'mongoose';

const websiteEnquirySchema = new mongoose.Schema({
  enquiryNumber: { type: String, unique: true, index: true },
  customer: {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
  },
  travelType: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  source: { type: String, enum: ['CONTACT', 'TOUR_PACKAGE'], default: 'CONTACT', index: true },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'TourPackage' },
  packageSnapshot: {
    title: { type: String, trim: true },
    slug: { type: String, trim: true },
    price: Number,
    durationLabel: { type: String, trim: true },
  },
  status: { type: String, enum: ['NEW', 'CONTACTED', 'RESOLVED', 'CLOSED'], default: 'NEW', index: true },
  adminNotes: { type: String, trim: true, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminAccount' },
  reviewedAt: Date,
}, { timestamps: true });

websiteEnquirySchema.pre('validate', function assignNumber() {
  if (!this.enquiryNumber) {
    this.enquiryNumber = `WEB-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  }
});

const WebsiteEnquiry = mongoose.model('WebsiteEnquiry', websiteEnquirySchema);
export { WebsiteEnquiry };

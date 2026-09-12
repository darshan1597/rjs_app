import mongoose from 'mongoose';

const stopSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  time: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String, 
    required: true,
    trim: true 
  },
  imageUrl: { 
    type: String, 
    trim: true, 
    default: '' 
  },
}, { _id: true });

const tourPackageSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true, 
    index: true 
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true, 
    index: true 
  },
  badge: { 
    type: String, 
    required: true, 
    trim: true 
  },
  shortDescription: { 
    type: String, 
    required: true, 
    trim: true 
  },
  heroSubtitle: { 
    type: String, 
    required: true, 
    trim: true 
  },
  about: { 
    type: String, 
    required: true, 
    trim: true 
  },
  originCity: { 
    type: String, 
    required: true, 
    trim: true, 
    default: 'Bengaluru' 
  },
  durationLabel: { 
    type: String, 
    required: true, 
    trim: true 
  },
  durationMinutes: { 
    type: Number, 
    required: true, 
    min: 60 
  },
  distanceKm: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  coverImageUrl: { 
    type: String, 
    trim: true, 
    default: '' 
  },
  gallery: { 
    type: [String], 
    default: [] 
  },
  idealFor: { 
    type: String, 
    required: true, 
    trim: true, 
    default: '1 - 4 People' 
  },
  driverLabel: { 
    type: String, 
    required: true, 
    trim: true, 
    default: 'Included' 
  },
  vehicleLabel: { 
    type: String, 
    required: true, 
    trim: true, 
    default: 'Any Car' 
  },
  vehicleDescription: { 
    type: String, 
    required: true, 
    trim: true, 
    default: 'Sedan / Hatchback / SUV' 
  },
  vehicleTraits: { 
    type: [String], 
    default: ['AC', 'Clean & Sanitized', 'Well Maintained'] 
  },
  vehicleTypes: { 
    type: [String], 
    enum: ['CAR', 'TEMPO_TRAVELLER', 'BUS'], 
    required: true 
  },
  inclusions: { 
    type: [String], 
    default: ['Driver', 'Fuel', 'Toll & Parking', 'Taxes'] 
  },
  inclusionDetails: { 
    type: [{ title: String, subtitle: String }], 
    default: [] 
  },
  places: { 
    type: [stopSchema], 
    default: [] 
  },
  itineraryNote: { 
    type: String, 
    trim: true, 
    default: 'The above is a suggested itinerary. Timings may vary based on your preference.' 
  },
  notes: { 
    type: [String], 
    default: [] 
  },
  safetyTitle: { 
    type: String, 
    trim: true, 
    default: 'Safe & Trusted' 
  },
  safetyMessage: { 
    type: String, 
    trim: true, 
    default: 'Your safety is our priority' 
  },
  priceNote: { 
    type: String, 
    trim: true, 
    default: 'All taxes included' 
  },
  freeCancellationHours: { 
    type: Number, 
    min: 0, 
    default: 24 
  },
  featured: { 
    type: Boolean, 
    default: false
  },
  status: { 
    type: String, 
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], 
    default: 'DRAFT', 
    index: true 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AdminAccount', 
    required: true 
  },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AdminAccount', 
    required: true 
  },
}, { timestamps: true });

const TourPackage = mongoose.model('TourPackage', tourPackageSchema);
export { TourPackage };

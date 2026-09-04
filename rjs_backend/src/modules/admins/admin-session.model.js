import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  adminId:{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AdminAccount', 
    required: true, 
    index: true 
  },
  refreshTokenHash:{ 
    type: String, 
    required: true, 
    select: false 
  },
  userAgent: String,
  ip: String,
  expiresAt:{ 
    type: Date, 
    required: true, 
    index: { expires: 0 } 
  },
  revokedAt: Date,
  lastUsedAt: Date,
}, { timestamps: true });

const AdminSession = mongoose.model('AdminSession', schema);
export { AdminSession };

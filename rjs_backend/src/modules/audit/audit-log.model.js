import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  actorType:{ 
    type: String, 
    enum: ['SUPER_ADMIN', 'EMPLOYEE', 'SYSTEM'], 
    required: true 
  },
  actorId:{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AdminAccount' 
  },
  action:{ 
    type: String, 
    required: true, 
    index: true 
  },
  targetType: String,
  targetId: mongoose.Schema.Types.ObjectId,
  metadata: mongoose.Schema.Types.Mixed,
  ip: String,
  userAgent: String,
}, { timestamps: true, versionKey: false });

const AuditLog = mongoose.model('AuditLog', schema);
export { AuditLog };

import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name:{ 
    type: String, 
    required: true, 
    trim: true 
  },
  email:{ 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true, 
    index: true 
  },
  passwordHash:{ 
    type: String, 
    required: true, 
    select: false 
  },
  accountType:{ 
    type: String, 
    enum: ['SUPER_ADMIN', 'EMPLOYEE'], 
    required: true 
  },
  status:{ 
    type: String, 
    enum: ['ACTIVE', 'DISABLED'], 
    default: 'ACTIVE', 
    index: true 
  },
  roleIds:[
    { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Role' 
    }
  ],
  mustChangePassword:{ 
    type: Boolean, 
    default: false 
  },
  lastLoginAt: Date,
  createdBy:{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AdminAccount' 
  },
  mfa: {
    enabled: { type: Boolean, default: false },
    encryptedSecret: { type: String, select: false },
    pendingEncryptedSecret: { type: String, select: false },
    recoveryCodeHashes: { type: [String], select: false, default: undefined },
    verifiedAt: Date,
  },
}, { timestamps: true });

schema.methods.toSafeObject = function toSafeObject() {
  return { id: this.id, name: this.name, email: this.email, accountType: this.accountType, status: this.status, roleIds: this.roleIds, mustChangePassword: this.mustChangePassword, mfaEnabled: Boolean(this.mfa?.enabled), lastLoginAt: this.lastLoginAt };
};

const AdminAccount = mongoose.model('AdminAccount', schema);
export { AdminAccount };

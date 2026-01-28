import mongoose from 'mongoose';

const platformAdminSchema = new mongoose.Schema({
  tenantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tenant', 
    required: true,
    index: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    lowercase: true,
    index: true
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  phone: { 
    type: String, 
    default: "",
    trim: true
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['platform_admin', 'tenant_admin', 'support'], 
    default: 'tenant_admin',
    required: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  collection: 'platform_admins' 
});

// Índice único para email
platformAdminSchema.index({ email: 1 }, { unique: true });

export const PlatformAdmin = mongoose.model('PlatformAdmin', platformAdminSchema);

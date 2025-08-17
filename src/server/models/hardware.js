import mongoose from 'mongoose';

const hardwareSchema = new mongoose.Schema({
  serialNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['server', 'storage', 'network', 'gpu', 'cpu', 'memory', 'other'], 
    required: true 
  },
  model: { 
    type: String, 
    required: true 
  },
  vendor: { 
    type: String, 
    required: true 
  },
  specifications: {
    cpu: { type: String },
    ram: { type: String },
    storage: { type: String },
    network: { type: String },
    power: { type: String },
    dimensions: { type: String }
  },
  location: {
    datacenter: { type: String },
    rack: { type: String },
    position: { type: String }
  },
  status: { 
    type: String, 
    enum: ['available', 'allocated', 'maintenance', 'retired', 'faulty'], 
    default: 'available' 
  },
  purchaseDate: { 
    type: Date 
  },
  warrantyExpiry: { 
    type: Date 
  },
  lastMaintenance: { 
    type: Date 
  },
  nextMaintenance: { 
    type: Date 
  },
  notes: { 
    type: String 
  },
  tags: [{ 
    type: String 
  }]
}, {
  timestamps: true
});

// Index for efficient queries
hardwareSchema.index({ serialNumber: 1 });
hardwareSchema.index({ status: 1 });
hardwareSchema.index({ type: 1 });
hardwareSchema.index({ location: 1 });

const Hardware = mongoose.model('Hardware', hardwareSchema);

export default Hardware;

import mongoose from 'mongoose';

const hardwareAllocationSchema = new mongoose.Schema({
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: true 
  },
  hardwareId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Hardware', 
    required: true 
  },
  serviceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Service' 
  },
  allocationDate: { 
    type: Date, 
    default: Date.now 
  },
  deallocationDate: { 
    type: Date 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'pending', 'suspended'], 
    default: 'active' 
  },
  allocationType: { 
    type: String, 
    enum: ['dedicated', 'shared', 'reserved'], 
    default: 'dedicated' 
  },
  usageDetails: {
    purpose: { type: String },
    workload: { type: String },
    performanceRequirements: { type: String }
  },
  billing: {
    rate: { type: Number },
    billingCycle: { type: String, enum: ['hourly', 'daily', 'monthly', 'yearly'] },
    lastBilled: { type: Date }
  },
  notes: { 
    type: String 
  },
  allocatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  deallocatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
hardwareAllocationSchema.index({ customerId: 1, status: 1 });
hardwareAllocationSchema.index({ hardwareId: 1, status: 1 });
hardwareAllocationSchema.index({ allocationDate: 1 });
hardwareAllocationSchema.index({ status: 1 });

// Ensure one active allocation per hardware piece
hardwareAllocationSchema.index({ hardwareId: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'active' } });

const HardwareAllocation = mongoose.model('HardwareAllocation', hardwareAllocationSchema);

export default HardwareAllocation;

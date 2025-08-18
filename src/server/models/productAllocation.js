import mongoose from 'mongoose';

const productAllocationSchema = new mongoose.Schema({
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: true 
  },
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
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
productAllocationSchema.index({ customerId: 1, status: 1 });
productAllocationSchema.index({ productId: 1, status: 1 });
productAllocationSchema.index({ allocationDate: 1 });
productAllocationSchema.index({ status: 1 });

// Ensure one active allocation per product (for hardware products)
productAllocationSchema.index({ productId: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'active' } });

const ProductAllocation = mongoose.model('ProductAllocation', productAllocationSchema);

export default ProductAllocation;

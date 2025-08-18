import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['ai_model', 'server', 'storage', 'network', 'gpu', 'cpu', 'memory', 'other'], required: true },
  vendor: { type: String },
  specifications: { type: Object },
  stock: { type: Number },
  price: { type: Number, required: true },
  
  // Hardware tracking fields
  serialNumber: { type: String, unique: true, sparse: true },
  model: { type: String },
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
  purchaseDate: { type: Date },
  warrantyExpiry: { type: Date },
  lastMaintenance: { type: Date },
  nextMaintenance: { type: Date },
  notes: { type: String },
  tags: [{ type: String }]
}, {
  timestamps: true
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;

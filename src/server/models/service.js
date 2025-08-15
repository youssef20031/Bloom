import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['ai_only', 'ai_hosted', 'infrastructure'], required: true },
  associatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  hostingDetails: {
    datacenterLocation: { type: String },
    vmSpecs: { type: Object }
  }
});

const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);

export default Service;

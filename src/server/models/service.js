import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    description: { type: String }
  },
  { timestamps: true }
);

const Service = mongoose.models.Service || mongoose.model('Service', ServiceSchema);

export default Service;

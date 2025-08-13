import mongoose from 'mongoose';

const datacenterSchema = new mongoose.Schema({
  location: { type: String, required: true },
  assetType: { type: String, enum: ['server', 'storage'], required: true },
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  iotReadings: [
    {
      timestamp: { type: Date, default: Date.now },
      temperature: { type: Number },
      humidity: { type: Number },
      powerDraw: { type: Number }
    }
  ]
});

const Datacenter = mongoose.model('Datacenter', datacenterSchema);

export default Datacenter;


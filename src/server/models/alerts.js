import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  datacenterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Datacenter', required: true },
  type: { type: String, enum: ['temperature', 'humidity', 'power', 'security'], required: true },
  severity: { type: String, enum: ['warning', 'critical'], required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['new', 'acknowledged', 'resolved'], default: 'new' },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false } // Added read field
});

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;

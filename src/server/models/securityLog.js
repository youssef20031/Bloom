import mongoose from 'mongoose';

const securityLogSchema = new mongoose.Schema({
  eventType: { type: String, enum: ['failed_login', 'successful_login'], required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sourceIp: { type: String },
  details: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const SecurityLog = mongoose.model('SecurityLog', securityLogSchema);

export default SecurityLog;


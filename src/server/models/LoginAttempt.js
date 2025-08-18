import mongoose from 'mongoose';

const loginAttemptSchema = new mongoose.Schema({
  email: { type: String, required: true },
  ipAddress: { type: String },
  success: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now }
});

const LoginAttempt = mongoose.model('LoginAttempt', loginAttemptSchema);
export default LoginAttempt;


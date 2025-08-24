import mongoose from 'mongoose';

const requestChangeSchema = new mongoose.Schema({
  supportTicketId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportTicket', required: true },
  tag: { type: String, enum: ['ai', 'dc'], required: true },
  description: { type: String },
  status: { type: String, enum: ['approved', 'not_approved','pending'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const RequestChange = mongoose.model('RequestChange', requestChangeSchema);

export default RequestChange;


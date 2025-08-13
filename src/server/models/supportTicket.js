import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  supportAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // role: 'support'
  issue: { type: String, required: true },
  status: { type: String, enum: ['open', 'in_progress', 'closed'], default: 'open' },
  history: [
    {
      message: { type: String },
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

export default SupportTicket;


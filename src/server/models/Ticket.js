import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    status: { type: String, enum: ['open','in-progress','closed'], default: 'open', index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export default mongoose.model('Ticket', TicketSchema);


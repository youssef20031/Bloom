import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  invoiceNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['paid', 'unpaid', 'overdue'], required: true },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  lineItems: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      description: { type: String },
      quantity: { type: Number },
      unitPrice: { type: Number }
    }
  ]
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;


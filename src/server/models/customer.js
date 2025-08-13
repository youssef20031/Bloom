import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  phone: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    country: { type: String }
  },
  purchasedServices: [
    {
      serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
      purchaseDate: { type: Date },
      status: { type: String, enum: ['active', 'expired'] },
      ipAddress: { type: String }
    }
  ]
});

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;


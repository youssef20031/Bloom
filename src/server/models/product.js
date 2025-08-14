import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['ai_model', 'server', 'storage'], required: true },
  vendor: { type: String },
  specifications: { type: Object },
  stock: { type: Number },
  price: { type: Number, required: true }
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;

import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import productRoutes from '../product.js';
import Product from '../../models/product.js';

const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);

describe('Product Routes', () => {
  let mongoServer;
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Product.deleteMany({});
  });

  let productId;

  it('should create a new product', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({
        name: 'Test Product',
        description: 'This is a test product.',
        type: 'ai_model',
        price: 100,
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('name', 'Test Product');
    productId = res.body._id;
  });

  it('should get all products', async () => {
    await Product.create({ name: 'Product 1', type: 'server', price: 200 });
    await Product.create({ name: 'Product 2', type: 'storage', price: 300 });

    const res = await request(app).get('/api/products');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(2);
  });

  it('should get a product by ID', async () => {
    const product = await Product.create({ name: 'FindMe', type: 'ai_model', price: 150 });
    const res = await request(app).get(`/api/products/${product._id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('name', 'FindMe');
  });

  it('should return 404 for a non-existent product ID', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/products/${nonExistentId}`);
    expect(res.statusCode).toEqual(404);
  });

  it('should update a product', async () => {
    const product = await Product.create({ name: 'UpdateMe', type: 'server', price: 250 });
    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .send({ name: 'Updated Product' });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('name', 'Updated Product');
  });

  it('should delete a product', async () => {
    const product = await Product.create({ name: 'DeleteMe', type: 'storage', price: 350 });
    const res = await request(app).delete(`/api/products/${product._id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Product deleted successfully');
  });
});

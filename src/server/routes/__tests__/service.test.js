import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import serviceRoutes from '../service.js';
import Service from '../../models/service.js';
import Product from '../../models/product.js';

const app = express();
app.use(express.json());
app.use('/api/services', serviceRoutes);

describe('Service Routes', () => {
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
    await Service.deleteMany({});
    await Product.deleteMany({});
  });

  it('should create a new service', async () => {
    const res = await request(app)
      .post('/api/services')
      .send({
        name: 'Test Service',
        description: 'A service for testing.',
        type: 'ai_only',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('name', 'Test Service');
  });

  it('should get all services', async () => {
    await Service.create({ name: 'Service 1', type: 'ai_only' });
    await Service.create({ name: 'Service 2', type: 'ai_hosted' });

    const res = await request(app).get('/api/services');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(2);
  });

  it('should get a service by ID', async () => {
    const service = await Service.create({ name: 'FindMe Service', type: 'infrastructure' });
    const res = await request(app).get(`/api/services/${service._id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('name', 'FindMe Service');
  });

  it('should search for services by name', async () => {
    await Service.create({ name: 'Searchable Service', type: 'ai_only' });
    const res = await request(app).get('/api/services/search?name=Searchable');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty('name', 'Searchable Service');
  });

  it('should update a service', async () => {
    const service = await Service.create({ name: 'UpdateMe Service', type: 'ai_hosted' });
    const res = await request(app)
      .put(`/api/services/${service._id}`)
      .send({ name: 'Updated Service' });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('name', 'Updated Service');
  });

  it('should delete a service', async () => {
    const service = await Service.create({ name: 'DeleteMe Service', type: 'infrastructure' });
    const res = await request(app).delete(`/api/services/${service._id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('name', 'DeleteMe Service');
  });

  it('should create a service and decrement product stock', async () => {
    const product = await Product.create({ name: 'Test Product', type: 'server', price: 100, stock: 5 });
    const res = await request(app)
      .post('/api/services')
      .send({
        name: 'Service with Product',
        description: 'A service that uses a product.',
        type: 'ai_hosted',
        associatedProducts: [product._id],
      });

    expect(res.statusCode).toEqual(201);
    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stock).toBe(4);
  });
});

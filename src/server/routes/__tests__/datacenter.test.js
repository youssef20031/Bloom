import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import datacenterRoutes from '../datacenter.js';
import Datacenter from '../../models/datacenter.js';
import Alert from '../../models/alerts.js';
import Product from '../../models/product.js';
import Customer from '../../models/customer.js';
import User from '../../models/user.js';

const app = express();
app.use(express.json());
app.use('/api/datacenter', datacenterRoutes);

describe('Datacenter Routes', () => {
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
    await Datacenter.deleteMany({});
    await Alert.deleteMany({});
    await Product.deleteMany({});
    await Customer.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/datacenter', () => {
    it('should create a new datacenter asset', async () => {
      const user = await new User({ name: 'Test User', email: 'user@test.com', password: 'password', role: 'customer' }).save();
      const product = await new Product({ name: 'Test Server', type: 'server', price: 1000, description: 'Test' }).save();
      const customer = await new Customer({ userId: user._id, companyName: 'Test Inc.', contactPerson: 'Test Contact' }).save();

      const res = await request(app)
        .post('/api/datacenter')
        .send({
          location: 'Test Location',
          assetType: 'server',
          assetId: product._id,
          customerId: customer._id,
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('location', 'Test Location');
    });
  });

  describe('POST /api/datacenter/:datacenterId/reading', () => {
    let datacenter;

    beforeEach(async () => {
      datacenter = await new Datacenter({
        location: 'Main DC',
        assetType: 'server',
      }).save();
    });

    it('should add an IoT reading and create alerts', async () => {
      const res = await request(app)
        .post(`/api/datacenter/${datacenter._id}/reading`)
        .send({ temperature: 35, humidity: 80, powerDraw: 1200 });

      expect(res.statusCode).toEqual(200);

      const updatedDatacenter = await Datacenter.findById(datacenter._id);
      expect(updatedDatacenter.iotReadings.length).toBe(1);

      const alerts = await Alert.find({ datacenterId: datacenter._id });
      expect(alerts.length).toBe(3);
    });
  });

  describe('GET /api/datacenter', () => {
    it('should get all assets with latest reading', async () => {
      const user = await new User({ name: 'Test User 2', email: 'user2@test.com', password: 'password', role: 'customer' }).save();
      const product = await new Product({ name: 'Test Server', type: 'server', price: 1000, description: 'Test' }).save();
      const customer = await new Customer({ userId: user._id, companyName: 'Test Inc. 2', contactPerson: 'Test Contact 2' }).save();

      await new Datacenter({
        location: 'DC1',
        assetType: 'server',
        assetId: product._id,
        customerId: customer._id,
        iotReadings: [
          { timestamp: new Date(), temperature: 25, humidity: 60, powerDraw: 500 },
          { timestamp: new Date(), temperature: 26, humidity: 61, powerDraw: 510 },
        ],
      }).save();

      const res = await request(app).get('/api/datacenter');

      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].latestReading).not.toBeNull();
      expect(res.body[0].latestReading.temperature).toBe(26);
    });
  });
});

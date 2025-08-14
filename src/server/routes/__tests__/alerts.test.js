import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import alertRoutes from '../alerts.js';
import Alert from '../../models/alerts.js';
import Datacenter from '../../models/datacenter.js';

const app = express();
app.use(express.json());
app.use('/api/alerts', alertRoutes);

describe('Alert Routes', () => {
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
    await Alert.deleteMany({});
    await Datacenter.deleteMany({});
  });

  it('should get all alerts', async () => {
    const datacenter = await new Datacenter({ location: 'Test DC', assetType: 'server' }).save();

    await Alert.create([
      {
        datacenterId: datacenter._id,
        type: 'security',
        message: 'Unauthorized access attempt detected.',
        severity: 'critical',
        source: 'Firewall',
      },
      {
        datacenterId: datacenter._id,
        type: 'power',
        message: 'CPU usage exceeds 90%.',
        severity: 'warning',
        source: 'Monitoring Service',
      },
    ]);

    const res = await request(app).get('/api/alerts');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(2);
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'security' }),
        expect.objectContaining({ type: 'power' }),
      ])
    );
  });
});

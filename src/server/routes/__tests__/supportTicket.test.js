// filepath: d:\Bloom\src\server\routes\__tests__\supportTicket.test.js
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import supportRoutes from '../supportTicket.js';
import Ticket from '../../models/Ticket.js';
import Customer from '../../models/customer.js';

const app = express();
app.use(express.json());
app.use('/api/support', supportRoutes);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Ticket.deleteMany({});
  await Customer.deleteMany({});
});

describe('Support Ticket API', () => {
  it('should return only open tickets sorted by createdAt', async () => {
    // Create a customer for reference
    const fakeUserId = new mongoose.Types.ObjectId();
    const customer = await Customer.create({ userId: fakeUserId, companyName: 'TestCo', contactPerson: 'Tester' });

    // Create tickets with different statuses
    const t1 = new Ticket({ subject: 'First Open', customerId: customer._id, status: 'open' });
    await t1.save();
    const t2 = new Ticket({ subject: 'Closed Ticket', customerId: customer._id, status: 'closed' });
    await t2.save();
    const t3 = new Ticket({ subject: 'Second Open', customerId: customer._id, status: 'open' });
    await t3.save();

    const res = await request(app).get('/api/support/tickets/open');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);

    // Tickets should be sorted by createdAt ascending
    expect(res.body[0]._id).toBe(t1._id.toString());
    expect(res.body[1]._id).toBe(t3._id.toString());

    // Ensure returned ticket fields
    const ticket0 = res.body[0];
    expect(ticket0).toHaveProperty('subject', 'First Open');
    expect(ticket0).toHaveProperty('status', 'open');
    expect(ticket0).toHaveProperty('customer');
    expect(ticket0.customer).toHaveProperty('_id', customer._id.toString());
  });

  it('should return empty array when no open tickets', async () => {
    const res = await request(app).get('/api/support/tickets/open');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });
});

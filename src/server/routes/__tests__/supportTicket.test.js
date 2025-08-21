import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import supportTicketRoutes from '../supportTicket.js';
import SupportTicket from '../../models/supportTicket.js';
import User from '../../models/user.js';
import Customer from '../../models/customer.js';

const app = express();
app.use(express.json());
app.use('/api/support-tickets', supportTicketRoutes);

describe('Support Ticket Routes', () => {
  let mongoServer;
  let testUser;
  let testCustomer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    testUser = await User.create({
      name: 'Ticket User',
      email: 'ticket@user.com',
      password: 'password123',
      role: 'customer'
    });

    testCustomer = await Customer.create({
      userId: testUser._id,
      companyName: 'Ticket Co',
      contactPerson: 'Alice',
      phone: '+1 555 111 2222',
      address: { street: '1 Road', city: 'City', country: 'US' },
      purchasedServices: []
    });
  });

  afterEach(async () => {
    await SupportTicket.deleteMany({});
    await Customer.deleteMany({});
    await User.deleteMany({});
  });

  it('should create a new support ticket via userId', async () => {
    const res = await request(app)
      .post('/api/support-tickets')
      .send({ userId: testUser._id.toString(), issue: 'Cannot access my service', initialMessage: 'Happens since yesterday' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('issue', 'Cannot access my service');
    expect(res.body).toHaveProperty('status', 'open');

    const count = await SupportTicket.countDocuments({ customerId: testCustomer._id });
    expect(count).toBe(1);
  });

  it('should list tickets for a customer by userId', async () => {
    await SupportTicket.create({ customerId: testCustomer._id, issue: 'Test issue' });

    const res = await request(app).get(`/api/support-tickets/customer/${testUser._id}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty('issue', 'Test issue');
  });

  it('should append a message and update status', async () => {
    const ticket = await SupportTicket.create({ customerId: testCustomer._id, issue: 'Intermittent downtime' });

    const addMsg = await request(app)
      .post(`/api/support-tickets/${ticket._id}/messages`)
      .send({ message: 'Additional details here', authorId: testUser._id.toString() });
    expect(addMsg.statusCode).toBe(200);
    expect(addMsg.body.history.length).toBe(1);
    expect(addMsg.body.history[0]).toHaveProperty('message', 'Additional details here');

    const upd = await request(app)
      .patch(`/api/support-tickets/${ticket._id}/status`)
      .send({ status: 'in_progress' });
    expect(upd.statusCode).toBe(200);
    expect(upd.body).toHaveProperty('status', 'in_progress');
  });
}); 
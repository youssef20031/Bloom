// filepath: d:\Bloom\src\server\routes\__tests__\customer.test.js
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import customerRoutes from '../customer.js';
import Customer from '../../models/customer.js';
import SupportTicket from '../../models/supportTicket.js';

const app = express();
app.use(express.json());
app.use('/api/customers', customerRoutes);

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
  await Customer.deleteMany({});
  await SupportTicket.deleteMany({});
});

describe('Customer API', () => {
  it('should create a new customer', async () => {
    const fakeUserId = new mongoose.Types.ObjectId();
    const payload = { userId: fakeUserId.toString(), companyName: 'Test Company', contactPerson: 'Tester' };
    const res = await request(app)
      .post('/api/customers')
      .send(payload);
    expect(res.statusCode).toBe(201);
    expect(res.body.companyName).toBe('Test Company');
    expect(res.body.contactPerson).toBe('Tester');
    expect(res.body.userId).toBe(fakeUserId.toString());
  });

  it('should get all customers', async () => {
    const uid1 = new mongoose.Types.ObjectId();
    const uid2 = new mongoose.Types.ObjectId();
    await Customer.create({ userId: uid1, companyName: 'A Co', contactPerson: 'A' });
    await Customer.create({ userId: uid2, companyName: 'B Co', contactPerson: 'B' });

    const res = await request(app).get('/api/customers');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('should update a customer', async () => {
    const uid = new mongoose.Types.ObjectId();
    const customer = await Customer.create({ userId: uid, companyName: 'Old Co', contactPerson: 'Old' });
    const newData = { companyName: 'New Co', contactPerson: 'New' };
    const res = await request(app)
      .put(`/api/customers/${customer._id}`)
      .send(newData);
    expect(res.statusCode).toBe(200);
    expect(res.body.companyName).toBe('New Co');
    expect(res.body.contactPerson).toBe('New');
  });

  it('should delete a customer', async () => {
    const uid = new mongoose.Types.ObjectId();
    const customer = await Customer.create({ userId: uid, companyName: 'Delete Co', contactPerson: 'Delete' });
    const res = await request(app).delete(`/api/customers/${customer._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Customer deleted');
  });

  it('should update hosting status', async () => {
    const uid = new mongoose.Types.ObjectId();
    const customer = await Customer.create({ userId: uid, companyName: 'Co', contactPerson: 'P' });
    const res = await request(app)
      .put(`/api/customers/${customer._id}/hosting/status`)
      .send({ hostingStatus: 'active' });
    expect(res.statusCode).toBe(200);
    expect(res.body.hostingStatus).toBe('active');
  });

  it('should fetch customer profile', async () => {
    const uid = new mongoose.Types.ObjectId();
    await Customer.create({ userId: uid, companyName: 'Co', contactPerson: 'P' });
    const res = await request(app).get(`/api/customers/profile/${uid.toString()}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.companyName).toBe('Co');
  });

  it('should get all customers with purchases', async () => {
    const uid = new mongoose.Types.ObjectId();
    await Customer.create({ userId: uid, companyName: 'Co', contactPerson: 'P', purchasedProducts: [{ productId: new mongoose.Types.ObjectId(), purchaseDate: new Date(), status: 'active', quantity: 1 }] });
    const res = await request(app).get('/api/customers/purchases/all');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  it('should get customer with purchases', async () => {
    const uid = new mongoose.Types.ObjectId();
    const customer = await Customer.create({ userId: uid, companyName: 'Co', contactPerson: 'P', purchasedProducts: [{ productId: new mongoose.Types.ObjectId(), purchaseDate: new Date(), status: 'active', quantity: 1 }] });
    const res = await request(app).get(`/api/customers/purchases/${customer._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.companyName).toBe('Co');
  });

  it('should create and retrieve support tickets', async () => {
    const uid = new mongoose.Types.ObjectId();
    const customer = await Customer.create({ userId: uid, companyName: 'Co', contactPerson: 'P' });
    const ticketRes = await request(app)
      .post('/api/customers/tickets')
      .send({ customerId: customer._id.toString(), issue: 'Test issue', priority: 'low' });
    expect(ticketRes.statusCode).toBe(201);
    expect(ticketRes.body.ticket.issue).toBe('Test issue');
    const ticketId = ticketRes.body.ticket._id;

    const listRes = await request(app).get(`/api/customers/tickets/${customer._id}`);
    expect(listRes.statusCode).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body[0]._id).toBe(ticketId);

    const detailRes = await request(app).get(`/api/customers/tickets/detail/${ticketId}`);
    expect(detailRes.statusCode).toBe(200);
    expect(detailRes.body.issue).toBe('Test issue');

    const msgRes = await request(app)
      .post(`/api/customers/tickets/${ticketId}/message`)
      .send({ message: 'Follow up', authorId: customer._id.toString() });
    expect(msgRes.statusCode).toBe(200);
    expect(msgRes.body.ticket.history.some(h => h.message === 'Follow up')).toBe(true);
  });

  it('should register and login a user', async () => {
    const email = 'test@example.com';
    const password = 'password123';
    const name = 'Test User';
    const regRes = await request(app)
      .post('/api/customers/register')
      .send({ name, email, password });
    expect(regRes.statusCode).toBe(201);
    expect(regRes.body.user.name).toBe(name);
    expect(regRes.body.user.email).toBe(email);
    expect(regRes.body.user.role).toBe('customer');

    const loginRes = await request(app)
      .post('/api/customers/login')
      .send({ email, password });
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.user.email).toBe(email);
  });
});

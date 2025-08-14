import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import invoiceRoutes from '../invoice.js';
import Invoice from '../../models/invoice.js';
import User from '../../models/user.js';

const app = express();
app.use(express.json());
app.use('/api/invoices', invoiceRoutes);

let mongoServer;
let user;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  user = new User({ name: 'Test User', email: 'test@example.com', password: 'password', role: 'customer' });
  await user.save();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
    await Invoice.deleteMany({});
});


describe('Invoice API', () => {
  it('should create a new invoice', async () => {
    const res = await request(app)
      .post('/api/invoices')
      .send({
        customerId: user._id,
        invoiceNumber: 'INV-001',
        amount: 100,
        dueDate: new Date(),
        status: 'unpaid',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.amount).toBe(100);
  });

  it('should get all invoices', async () => {
    const invoice1 = new Invoice({ customerId: user._id, invoiceNumber: 'INV-002', amount: 100, dueDate: new Date(), status: 'unpaid' });
    const invoice2 = new Invoice({ customerId: user._id, invoiceNumber: 'INV-003', amount: 200, dueDate: new Date(), status: 'paid' });
    await invoice1.save();
    await invoice2.save();

    const res = await request(app).get('/api/invoices');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(2);
  });

  it('should get a single invoice by ID', async () => {
    const invoice = new Invoice({ customerId: user._id, invoiceNumber: 'INV-004', amount: 150, dueDate: new Date(), status: 'unpaid' });
    await invoice.save();

    const res = await request(app).get(`/api/invoices/${invoice._id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body._id).toBe(invoice._id.toString());
  });

  it('should update an invoice', async () => {
    const invoice = new Invoice({ customerId: user._id, invoiceNumber: 'INV-005', amount: 250, dueDate: new Date(), status: 'unpaid' });
    await invoice.save();

    const res = await request(app)
      .put(`/api/invoices/${invoice._id}`)
      .send({ status: 'paid' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('paid');
  });

  it('should delete an invoice', async () => {
    const invoice = new Invoice({ customerId: user._id, invoiceNumber: 'INV-006', amount: 300, dueDate: new Date(), status: 'unpaid' });
    await invoice.save();

    const res = await request(app).delete(`/api/invoices/${invoice._id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('Invoice deleted successfully');
  });
});

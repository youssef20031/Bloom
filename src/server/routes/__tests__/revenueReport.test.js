import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import revenueReportRoutes from '../revenueReport.js';
import Invoice from '../../models/invoice.js';
import User from '../../models/user.js';

const app = express();
app.use(express.json());
app.use('/api/revenue-report', revenueReportRoutes);

let mongoServer;
let user;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  user = new User({ name: 'Admin', email: 'admin@example.com', password: 'password', role: 'admin' });
  await user.save();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Invoice.deleteMany({});
});

describe('Revenue Report API', () => {
  it('should return monthly revenue for paid invoices in a given year', async () => {
    // Create invoices
    const invoices = [
      { customerId: user._id, invoiceNumber: 'R-001', amount: 100, status: 'paid', issueDate: new Date('2025-01-15') },
      { customerId: user._id, invoiceNumber: 'R-002', amount: 200, status: 'paid', issueDate: new Date('2025-03-20') },
      { customerId: user._id, invoiceNumber: 'R-003', amount: 150, status: 'unpaid', issueDate: new Date('2025-03-25') }
    ];
    await Invoice.insertMany(invoices);

    const res = await request(app).get('/api/revenue-report?year=2025');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toEqual([
      { month: 1, revenue: 100 },
      { month: 3, revenue: 200 }
    ]);
  });

  it('should default to current year if no year provided', async () => {
    const currentYear = new Date().getFullYear();
    // One paid invoice in current year
    await Invoice.create({ customerId: user._id, invoiceNumber: 'R-004', amount: 300, status: 'paid', issueDate: new Date(`${currentYear}-05-10`) });

    const res = await request(app).get('/api/revenue-report');
    expect(res.statusCode).toEqual(200);
    // Should have at least one entry for month 5
    const months = res.body.map(r => r.month);
    expect(months).toContain(5);
    const entry = res.body.find(r => r.month === 5);
    expect(entry.revenue).toBe(300);
  });

  it('should return empty array if no paid invoices found', async () => {
    const res = await request(app).get('/api/revenue-report?year=2024');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual([]);
  });
});

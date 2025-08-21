// filepath: d:/Bloom/src/server/routes/__tests__/customer.test.js
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
    await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
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
        expect(res.body).toHaveProperty('_id');
        expect(res.body.companyName).toBe('Test Company');
        expect(res.body.contactPerson).toBe('Tester');
        expect(res.body.userId).toBe(fakeUserId.toString());
    });

    it('should get all customers', async () => {
        const uid1 = new mongoose.Types.ObjectId();
        const uid2 = new mongoose.Types.ObjectId();
        await Customer.create({ userId: uid1.toString(), companyName: 'A Co', contactPerson: 'A' });
        await Customer.create({ userId: uid2.toString(), companyName: 'B Co', contactPerson: 'B' });

        const res = await request(app).get('/api/customers');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
    });

    it('should update a customer', async () => {
        const uid = new mongoose.Types.ObjectId();
        const customer = await Customer.create({ userId: uid.toString(), companyName: 'Old Co', contactPerson: 'Old' });

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
        const customer = await Customer.create({ userId: uid.toString(), companyName: 'Delete Co', contactPerson: 'Delete' });

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
});
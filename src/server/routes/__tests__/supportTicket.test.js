// filepath: d:\Bloom\src\server\routes\__tests__\supportTicket.test.js
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import supportRoutes from '../supportTicket.js';
import Ticket from '../../models/Ticket.js';
import Customer from '../../models/customer.js';
import SupportTicket from '../../models/supportTicket.js';
import User from '../../models/user.js';

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
    await SupportTicket.deleteMany({});
    await Ticket.deleteMany({});
    await Customer.deleteMany({});
    await User.deleteMany({});
});

describe('Support Ticket API', () => {
    let customer;
    let agent;

    beforeEach(async () => {
        const fakeUserId = new mongoose.Types.ObjectId();
        customer = await Customer.create({ userId: fakeUserId, companyName: 'TestCo', contactPerson: 'Tester' });
        agent = await User.create({ name: 'Agent Smith', email: 'agent@example.com', password: 'password123', role: 'support' });
    });

    it('should create a new support ticket', async () => {
        const res = await request(app)
            .post('/api/support')
            .send({ customerId: customer._id, issue: 'Test issue', priority: 'high' });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('ticket');
        expect(res.body.ticket).toHaveProperty('issue', 'Test issue');
        expect(res.body.ticket).toHaveProperty('priority', 'high');
        expect(res.body.ticket).toHaveProperty('status', 'open');
    });

    it('should get a support ticket by id', async () => {
        const ticket = await SupportTicket.create({ customerId: customer._id, issue: 'Lookup issue' });
        const res = await request(app).get(`/api/support/${ticket._id}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('_id', ticket._id.toString());
        expect(res.body).toHaveProperty('issue', 'Lookup issue');
        expect(res.body.customerId).toHaveProperty('_id', customer._id.toString());
    });

    it('should list support tickets with optional status filter', async () => {
        await SupportTicket.create({ customerId: customer._id, issue: 'A', status: 'open' });
        await SupportTicket.create({ customerId: customer._id, issue: 'B', status: 'closed' });

        const resAll = await request(app).get('/api/support');
        expect(resAll.statusCode).toBe(200);
        expect(Array.isArray(resAll.body)).toBe(true);
        expect(resAll.body.length).toBe(2);

        const resOpen = await request(app).get('/api/support').query({ status: 'open' });
        expect(resOpen.statusCode).toBe(200);
        expect(resOpen.body.length).toBe(1);
        expect(resOpen.body[0]).toHaveProperty('status', 'open');
    });

    it('should add a message to a support ticket', async () => {
        const ticket = await SupportTicket.create({ customerId: customer._id, issue: 'Message issue' });
        const res = await request(app)
            .post(`/api/support/${ticket._id}/message`)
            .send({ message: 'New message', authorId: agent._id });

        expect(res.statusCode).toBe(200);
        expect(res.body.ticket.history).toHaveLength(1);
        expect(res.body.ticket.history[0]).toHaveProperty('message', 'New message');
    });

    it('should update the status of a ticket', async () => {
        const ticket = await SupportTicket.create({ customerId: customer._id, issue: 'Status issue' });
        const res = await request(app)
            .put(`/api/support/${ticket._id}/status`)
            .send({ status: 'in_progress' });

        expect(res.statusCode).toBe(200);
        expect(res.body.ticket).toHaveProperty('status', 'in_progress');
    });

    it('should assign a support agent to a ticket', async () => {
        const ticket = await SupportTicket.create({ customerId: customer._id, issue: 'Assign issue' });
        const res = await request(app)
            .put(`/api/support/${ticket._id}/assign`)
            .send({ supportAgentId: agent._id });

        expect(res.statusCode).toBe(200);
        expect(res.body.ticket.supportAgentId).toHaveProperty('_id', agent._id.toString());
    });

    it('should delete a support ticket', async () => {
        const ticket = await SupportTicket.create({ customerId: customer._id, issue: 'Delete issue' });
        const res = await request(app).delete(`/api/support/${ticket._id}`);

        expect(res.statusCode).toBe(200);
        expect(await SupportTicket.findById(ticket._id)).toBeNull();
    });
});
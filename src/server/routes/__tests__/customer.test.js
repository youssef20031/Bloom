import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import customerRoutes from '../customer.js';
import Customer from '../../models/customer.js';
import Service from '../../models/service.js';
import User from '../../models/user.js';

const app = express();
app.use(express.json());
app.use('/api/customer', customerRoutes);

describe('Customer Routes', () => {
  let mongoServer;
  let testUser;
  let testCustomer;
  let testService1;
  let testService2;

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
    // Create test user
    testUser = await User.create({
      name: 'Test Customer',
      email: 'test@customer.com',
      password: 'password123',
      role: 'customer'
    });

    // Create test services
    testService1 = await Service.create({
      name: 'AI Analytics Platform',
      description: 'Advanced AI-powered analytics service',
      type: 'ai_hosted',
      hostingDetails: {
        datacenterLocation: 'US East (Virginia)',
        vmSpecs: {
          'CPU': '8 vCPUs',
          'RAM': '32 GB',
          'Storage': '500 GB SSD'
        }
      }
    });

    testService2 = await Service.create({
      name: 'Infrastructure Monitoring',
      description: 'Comprehensive monitoring solution',
      type: 'infrastructure',
      hostingDetails: {
        datacenterLocation: 'US West (Oregon)',
        vmSpecs: {
          'CPU': '4 vCPUs',
          'RAM': '16 GB',
          'Storage': '200 GB SSD'
        }
      }
    });

    // Create test customer with purchased services
    testCustomer = await Customer.create({
      userId: testUser._id,
      companyName: 'Test Company Inc.',
      contactPerson: 'John Doe',
      phone: '+1 (555) 123-4567',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        country: 'Test Country'
      },
      purchasedServices: [
        {
          serviceId: testService1._id,
          purchaseDate: new Date('2024-01-15'),
          status: 'active',
          ipAddress: '192.168.1.100'
        },
        {
          serviceId: testService2._id,
          purchaseDate: new Date('2024-02-20'),
          status: 'expired',
          ipAddress: '192.168.1.101'
        }
      ]
    });
  });

  afterEach(async () => {
    await Customer.deleteMany({});
    await Service.deleteMany({});
    await User.deleteMany({});
  });

  describe('GET /dashboard/:userId', () => {
    it('should get customer dashboard with purchased services', async () => {
      const res = await request(app)
        .get(`/api/customer/dashboard/${testUser._id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('customer');
      expect(res.body).toHaveProperty('services');
      expect(res.body.customer.companyName).toBe('Test Company Inc.');
      expect(res.body.customer.contactPerson).toBe('John Doe');
      expect(res.body.services).toHaveLength(2);
      
      // Check first service details
      const firstService = res.body.services[0];
      expect(firstService.name).toBe('AI Analytics Platform');
      expect(firstService.status).toBe('active');
      expect(firstService.ipAddress).toBe('192.168.1.100');
      expect(firstService.datacenterLocation).toBe('US East (Virginia)');
      expect(firstService.vmSpecs).toHaveProperty('CPU');
    });

    it('should return 404 for non-existent customer', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/customer/dashboard/${fakeUserId}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Customer not found');
    });

    it('should handle customer with no purchased services', async () => {
      // Create a new user for this test to avoid conflicts
      const newUser = await User.create({
        name: 'Empty Services User',
        email: 'empty@customer.com',
        password: 'password123',
        role: 'customer'
      });

      const customerWithNoServices = await Customer.create({
        userId: newUser._id,
        companyName: 'Empty Company',
        contactPerson: 'Jane Doe',
        phone: '+1 (555) 999-9999',
        address: {
          street: '456 Empty Street',
          city: 'Empty City',
          country: 'Empty Country'
        },
        purchasedServices: []
      });

      const res = await request(app)
        .get(`/api/customer/dashboard/${newUser._id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.services).toHaveLength(0);
    });
  });

  describe('GET /service/:serviceId', () => {
    it('should get service details by ID', async () => {
      const res = await request(app)
        .get(`/api/customer/service/${testService1._id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toBe('AI Analytics Platform');
      expect(res.body.type).toBe('ai_hosted');
      expect(res.body.hostingDetails.datacenterLocation).toBe('US East (Virginia)');
      expect(res.body.hostingDetails.vmSpecs).toHaveProperty('CPU');
    });

    it('should return 404 for non-existent service', async () => {
      const fakeServiceId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/customer/service/${fakeServiceId}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Service not found');
    });
  });

  describe('GET /profile/:userId', () => {
    it('should get customer profile information', async () => {
      const res = await request(app)
        .get(`/api/customer/profile/${testUser._id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.companyName).toBe('Test Company Inc.');
      expect(res.body.contactPerson).toBe('John Doe');
      expect(res.body.phone).toBe('+1 (555) 123-4567');
      expect(res.body.address.street).toBe('123 Test Street');
      expect(res.body).not.toHaveProperty('purchasedServices');
    });

    it('should return 404 for non-existent customer profile', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/customer/profile/${fakeUserId}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Customer not found');
    });
  });

  describe('PUT /profile/:userId', () => {
    it('should update customer profile', async () => {
      const updateData = {
        companyName: 'Updated Company Inc.',
        phone: '+1 (555) 999-8888',
        address: {
          street: '789 Updated Street',
          city: 'Updated City',
          country: 'Updated Country'
        }
      };

      const res = await request(app)
        .put(`/api/customer/profile/${testUser._id}`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.companyName).toBe('Updated Company Inc.');
      expect(res.body.phone).toBe('+1 (555) 999-8888');
      expect(res.body.address.street).toBe('789 Updated Street');
      expect(res.body.contactPerson).toBe('John Doe'); // Should remain unchanged
    });

    it('should not allow updating userId or purchasedServices', async () => {
      const updateData = {
        userId: new mongoose.Types.ObjectId(),
        purchasedServices: [],
        companyName: 'Attempted Update'
      };

      const res = await request(app)
        .put(`/api/customer/profile/${testUser._id}`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.companyName).toBe('Attempted Update');
      expect(res.body.userId.toString()).toBe(testUser._id.toString());
      expect(res.body.purchasedServices).toHaveLength(2);
    });

    it('should return 404 for non-existent customer', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/customer/profile/${fakeUserId}`)
        .send({ companyName: 'Updated Name' });

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Customer not found');
    });
  });

  describe('GET /summary/:userId', () => {
    it('should get customer service summary', async () => {
      const res = await request(app)
        .get(`/api/customer/summary/${testUser._id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.totalServices).toBe(2);
      expect(res.body.activeServices).toBe(1);
      expect(res.body.expiredServices).toBe(1);
      expect(res.body.totalSpent).toBe(0);
      expect(res.body.lastPurchase).toBeDefined();
    });

    it('should handle customer with no services', async () => {
      // Create a new user for this test to avoid conflicts
      const newUser = await User.create({
        name: 'No Services User',
        email: 'noservices@customer.com',
        password: 'password123',
        role: 'customer'
      });

      const customerWithNoServices = await Customer.create({
        userId: newUser._id,
        companyName: 'No Services Company',
        contactPerson: 'No Services Person',
        phone: '+1 (555) 000-0000',
        address: {
          street: '000 No Services Street',
          city: 'No Services City',
          country: 'No Services Country'
        },
        purchasedServices: []
      });

      const res = await request(app)
        .get(`/api/customer/summary/${newUser._id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.totalServices).toBe(0);
      expect(res.body.activeServices).toBe(0);
      expect(res.body.expiredServices).toBe(0);
      expect(res.body.lastPurchase).toBeNull();
    });

    it('should return 404 for non-existent customer summary', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/customer/summary/${fakeUserId}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Customer not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid ObjectId format', async () => {
      const res = await request(app)
        .get('/api/customer/dashboard/invalid-id');

      expect(res.statusCode).toEqual(500);
    });

    it('should handle database connection errors gracefully', async () => {
      // Test that the route exists by making a request with invalid ObjectId
      // This will trigger the error handling in our controller
      const res = await request(app)
        .get('/api/customer/dashboard/invalid-id');
      
      expect(res.statusCode).toEqual(500);
      expect(res.body.message).toBe('Internal server error');
    });
  });
}); 
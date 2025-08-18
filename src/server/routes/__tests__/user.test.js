import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import userRoutes from '../user.js';
import User from '../../models/user.js';

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

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
    await User.deleteMany({});
});

describe('User API', () => {
  it('should create a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
        role: 'customer'
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.name).toBe('Test User');
  });

  it('should get all users', async () => {
    const user1 = new User({ name: 'User One', email: 'one@example.com', password: 'password', role: 'customer' });
    const user2 = new User({ name: 'User Two', email: 'two@example.com', password: 'password', role: 'admin' });
    await user1.save();
    await user2.save();

    const res = await request(app).get('/api/users');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(2);
  });

  it('should get a single user by ID', async () => {
    const user = new User({ name: 'Specific User', email: 'specific@example.com', password: 'password', role: 'customer' });
    await user.save();

    const res = await request(app).get(`/api/users/${user._id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body._id).toBe(user._id.toString());
  });

  it('should get a single user by email', async () => {
    const user = new User({ name: 'Email User', email: 'email@example.com', password: 'password', role: 'customer' });
    await user.save();

    const res = await request(app).get(`/api/users/email/${user.email}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.email).toBe(user.email);
  });

  it('should update a user', async () => {
    const user = new User({ name: 'Update User', email: 'update@example.com', password: 'password', role: 'customer' });
    await user.save();

    const res = await request(app)
      .put(`/api/users/${user._id}`)
      .send({ name: 'Updated User Name' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toBe('Updated User Name');
  });

  it('should delete a user', async () => {
    const user = new User({ name: 'Delete User', email: 'delete@example.com', password: 'password', role: 'customer' });
    await user.save();

    const res = await request(app).delete(`/api/users/${user._id}`);
    expect(res.statusCode).toEqual(200);
  });
});


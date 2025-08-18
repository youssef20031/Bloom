// WebSocket integration test: verifies that posting a datacenter reading emits alert events over socket.io
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { io as Client } from 'socket.io-client';
import { createTestServer } from '../../serverFactory.js';

jest.setTimeout(15000);

describe('WebSocket alerts emission', () => {
  let mongoServer; let serverRef; let port; let closeServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    const { app, server, port: p, close } = await createTestServer(uri);
    serverRef = { app, server };
    port = p;
    closeServer = close;
  });

  afterAll(async () => {
    await closeServer();
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('emits three alerts (temperature, humidity, power) when thresholds exceeded', async () => {
    // 1. Create a datacenter asset
    const createRes = await request(serverRef.app)
      .post('/api/datacenter')
      .send({ location: 'WS-DC', assetType: 'server' });
    expect(createRes.statusCode).toBe(201);
    const id = createRes.body._id;

    const received = [];

    // 2. Connect socket client
    const socket = Client(`http://localhost:${port}`, { transports: ['websocket'], forceNew: true });

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Socket connect timeout')), 5000);
      socket.on('connect', () => { clearTimeout(timer); resolve(); });
      socket.on('connect_error', err => { clearTimeout(timer); reject(err); });
    });

    socket.on('new-alert', data => { received.push(data); });

    // 3. Post reading that triggers all 3 alerts
    const readingRes = await request(serverRef.app)
      .post(`/api/datacenter/${id}/reading`)
      .send({ temperature: 35, humidity: 80, powerDraw: 1200 });
    expect(readingRes.statusCode).toBe(200);

    // 4. Wait until 3 alerts or timeout
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => resolve(), 4000); // resolve anyway to assert whatever we got
      const check = () => {
        if (received.length === 3) { clearTimeout(timeout); resolve(); }
        else setTimeout(check, 100);
      };
      check();
    });

    socket.close();

    expect(received.length).toBe(3);
    const types = received.map(a => a.type).sort();
    expect(types).toEqual(['humidity', 'power', 'temperature']);
  });
});

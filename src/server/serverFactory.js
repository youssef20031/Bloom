import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import userRoutes from './routes/user.js';
import serviceRoutes from './routes/service.js';
import datacenterRoutes from './routes/datacenter.js';
import alertsRoutes from './routes/alerts.js';
import invoiceRoutes from './routes/invoice.js';
import productRoutes from './routes/product.js';
import { setIo } from './socket.js';
import { connectWithRetry } from './utils/mongo.js';

export async function createTestServer(mongoUri) {
  if (mongoose.connection.readyState !== 1) {
    await connectWithRetry(mongoUri, { maxRetries: 3, baseDelay: 200 });
  }
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mount routes
  app.use('/api/users', userRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/service', serviceRoutes);
  app.use('/api/datacenter', datacenterRoutes);
  app.use('/api/alerts', alertsRoutes);

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  setIo(io);

  await new Promise(resolve => server.listen(0, resolve));
  const { port } = server.address();

  function close() {
    return new Promise(resolve => {
      io.close(() => {
        server.close(() => resolve());
      });
    });
  }

  return { app, server, io, port, close };
}

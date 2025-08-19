import express from "express";
import ViteExpress from "vite-express";
import mongoose from "mongoose";
import dotenv from 'dotenv';
import { Server } from "socket.io";  
import http from "http";          
import user from "./routes/user.js";
import serviceRoutes from './routes/service.js';
import datacenterRoutes from'./routes/datacenter.js'
import alertsRoutes from './routes/alerts.js'
import invoiceRoutes from './routes/invoice.js';
import productRoutes from './routes/product.js';
import { setIo } from './socket.js';
import customerRoutes from "./routes/customer.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Change to frontend origin for security
  }
});
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/customers", customerRoutes);
setIo(io);
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log("Successfully connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

app.get("/hello", (req, res) => {
  res.send("Hello Vite + React!");
});

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Add this line


// User routes
app.use("/api/users", user);

// Invoice routes
app.use('/api/invoices', invoiceRoutes);

// Product routes
app.use('/api/products', productRoutes);

// Service routes
app.use('/api/service', serviceRoutes);

// Datacenter routes
app.use('/api/datacenter',datacenterRoutes);

// Alerts routes
app.use('/api/alerts',alertsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});


io.on("connection", (socket) => {
  console.log("🔌 Frontend connected to WebSocket");

  socket.on("disconnect", () => {
    console.log("❌ Frontend disconnected from WebSocket");
  });
});

ViteExpress.bind(app, server);

// Listen on one port for both API + WebSocket
server.listen(3000, () => {
  console.log("Server + WebSocket running on port 3000");
});

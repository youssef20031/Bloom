import express from "express";
import ViteExpress from "vite-express";
import mongoose from "mongoose";
import dotenv from 'dotenv';
import { Server } from "socket.io";  
import http from "http";          
import user from "./routes/user.js";
import serviceRoutes from './routes/service.js';
import supportTicketRoutes from './routes/supportTicket.js';
import datacenterRoutes from'./routes/datacenter.js'
import alertsRoutes from './routes/alerts.js'
import invoiceRoutes from './routes/invoice.js';
import productRoutes from './routes/product.js';
import { setIo } from './socket.js';
import customerRoutes from "./routes/customer.js";
import cors from "cors";
import chatRoutes from "./routes/chatBot.js";
import requestChangeRoutes from './routes/requestChange.js';


dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Change to frontend origin for security
  }
});

// Set the io instance for AlertService to use
setIo(io);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/customers", customerRoutes);
app.use("/api/support-ticket", supportTicketRoutes); // Use only /api/support-ticket for support tickets
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

// Support ticket routes
app.use('/api/support-ticket', supportTicketRoutes);


app.use('/api/chat', chatRoutes);
app.use('/api/request-change', requestChangeRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});


io.on("connection", (socket) => {
  console.log("🔌 Frontend connected to WebSocket");

  // Handle test events
  socket.on("testEvent", (data) => {
    console.log("📦 Test event received:", data);
    socket.emit("test-response", { message: "Test event received successfully" });
  });

  // Handle alert-related events
  socket.on("mark-alert-read", async (data) => {
    try {
      console.log("📋 Marking alert as read:", data.alertId);
      // Broadcast to all clients that alert was marked as read
      io.emit("alert-update", { 
        alertId: data.alertId, 
        action: "marked_read",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  });

  // Join IT dashboard room for targeted alerts
  socket.on("join-it-dashboard", () => {
    socket.join("it-dashboard");
    console.log("👩‍💻 Client joined IT dashboard room, socket ID:", socket.id);
    console.log("🏠 Current rooms for this socket:", Array.from(socket.rooms));
  });

  socket.on("disconnect", () => {
    console.log("❌ Frontend disconnected from WebSocket");
  });
});

ViteExpress.bind(app, server);

// Listen on one port for both API + WebSocket
server.listen(3000, () => {
  console.log("Server + WebSocket running on port 3000");
});

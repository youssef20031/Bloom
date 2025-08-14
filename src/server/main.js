import express from "express";
import ViteExpress from "vite-express";
import mongoose from "mongoose";
import dotenv from 'dotenv';
import user from "./routes/user.js";
import serviceRoutes from './routes/service.js';
import datacenterRoutes from'./routes/datacenter.js'
import alertsRoutes from './routes/alerts.js'
import invoiceRoutes from './routes/invoice.js';
import productRoutes from './routes/product.js';
import customerRoutes from './routes/customer.js';
import { populateDemoData } from './demo-data.js';

dotenv.config();

const app = express();

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log("Successfully connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

app.get("/hello", (req, res) => {
  res.send("Hello Vite + React!");
});

// Demo data population endpoint
app.post("/api/demo/populate", async (req, res) => {
  try {
    const userId = await populateDemoData();
    res.json({ 
      message: "Demo data populated successfully", 
      userId: userId.toString() 
    });
  } catch (error) {
    console.error("Error populating demo data:", error);
    res.status(500).json({ message: "Failed to populate demo data" });
  }
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

// Customer routes
app.use('/api/customer', customerRoutes);

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000..."),
);
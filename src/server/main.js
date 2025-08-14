import express from "express";
import ViteExpress from "vite-express";
import mongoose from "mongoose";
import dotenv from 'dotenv';
import userRoutes from './routes/user.js';
import serviceRoutes from './routes/service.js';
import productRoutes from './routes/product.js';
import datacenterRoutes from'./routes/datacenter.js'
import alertsRoutes from './routes/alerts.js'
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
app.get("/", (req, res) => {
  res.send("The server is running");
});
ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000..."),
);
app.use(express.json());
app.use('/api/user', userRoutes);
app.use('/api/service', serviceRoutes);
app.use('/api/product', productRoutes);
app.use('/api/datacenter',datacenterRoutes);
app.use('/api/alerts',alertsRoutes);
import express from "express";
import ViteExpress from "vite-express";
import mongoose from "mongoose";
import dotenv from 'dotenv';
import user from "./routes/user.js";

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

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Add this line


// User routes
app.use("/api/users", user);


ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000..."),
);

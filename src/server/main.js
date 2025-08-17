import express from "express";
import ViteExpress from "vite-express";
import customerRoutes from "./routes/customer.js";
import userRoutes from "./routes/user.js";
import hardwareRoutes from "./routes/hardware.js";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/customers", customerRoutes);
app.use("/api/users", userRoutes);
app.use("/api/hardware", hardwareRoutes);

app.get("/hello", (req, res) => {
  res.send("Hello Vite + React!");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000..."),
);
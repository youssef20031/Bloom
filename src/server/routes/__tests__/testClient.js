import { io } from "socket.io-client";

// Replace with your backend address and port
const socket = io("http://localhost:3000", {
  transports: ["websocket"], // Force WebSocket
});

socket.on("connect", () => {
  console.log("✅ Connected to backend WebSocket");
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from backend WebSocket");
});

// Example: listen for custom events
socket.on("new-alert", (data) => {
  console.log("📦 Order update received:", data);
});

// Example: send a test event to backend
socket.emit("testEvent", { message: "Hello from test client" });

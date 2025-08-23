import { io } from "socket.io-client";

// WebSocket connection setup
class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    if (this.socket) {
      return this.socket;
    }

    // Connect to backend WebSocket
    this.socket = io("http://localhost:3000", {
      transports: ["websocket"], // Force WebSocket
      forceNew: true,
    });

    // Connection events
    this.socket.on("connect", () => {
      console.log("✅ Connected to backend WebSocket");
      this.isConnected = true;
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Disconnected from backend WebSocket");
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Alert-specific methods
  onNewAlert(callback) {
    if (this.socket) {
      this.socket.on("new-alert", callback);
      // Also listen for IT-specific alerts
      this.socket.on("it-alert", callback);
    }
  }

  onAlertUpdate(callback) {
    if (this.socket) {
      this.socket.on("alert-update", callback);
    }
  }

  onAlertResolved(callback) {
    if (this.socket) {
      this.socket.on("alert-resolved", callback);
    }
  }

  // Emit events
  markAlertAsRead(alertId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("mark-alert-read", { alertId });
    }
  }

  // Test events
  sendTestEvent(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit("testEvent", data);
    }
  }

  // Remove listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;


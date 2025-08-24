import { io } from "socket.io-client";

// WebSocket connection setup
class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    // Connect to backend WebSocket with retry logic
    this.socket = io("http://localhost:3000", {
      transports: ["websocket", "polling"], // Allow fallback to polling
      forceNew: false, // Allow reusing existing connection
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 5,
      timeout: 20000,
    });

    // Connection events
    this.socket.on("connect", () => {
      console.log("✅ Connected to backend WebSocket");
      this.isConnected = true;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from backend WebSocket:", reason);
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error);
      this.isConnected = false;
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log("🔄 Reconnected to WebSocket after", attemptNumber, "attempts");
      this.isConnected = true;
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      console.log("🔄 Attempting to reconnect... (attempt", attemptNumber, ")");
    });

    this.socket.on("reconnect_failed", () => {
      console.error("❌ Failed to reconnect to WebSocket after maximum attempts");
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


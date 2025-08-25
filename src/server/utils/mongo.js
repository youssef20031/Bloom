// Reusable MongoDB connection with retry logic
import mongoose from 'mongoose';

let connectionPromise = null;

// Read optional env overrides
const envInt = (name, def) => {
  const v = process.env[name];
  if (!v) return def;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? def : n;
};

export async function connectWithRetry(uri, options = {}) {
  if (!uri) throw new Error('MongoDB URI is required');
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  const maxRetries = options.maxRetries ?? envInt('MONGO_MAX_RETRIES', 5);
  const baseDelay = options.baseDelay ?? envInt('MONGO_RETRY_BASE_MS', 500); // ms
  const factor = options.factor ?? Number(process.env.MONGO_RETRY_FACTOR || 1.8);
  const maxDelay = options.maxDelay ?? envInt('MONGO_MAX_DELAY_MS', 5000);
  const mongooseOptions = {
    // Sensible defaults; can be overridden via options.mongooseOptions
    autoIndex: false,
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 10,
    minPoolSize: 1,
    retryWrites: true,
    ...options.mongooseOptions,
  };

  let attempt = 0;

  async function attemptConnect() {
    attempt += 1;
    try {
      const start = Date.now();
      connectionPromise = mongoose.connect(uri, mongooseOptions);
      await connectionPromise;
      const ms = Date.now() - start;
      console.log(`✅ MongoDB connected after attempt ${attempt} in ${ms} ms`);
      return mongoose.connection;
    } catch (err) {
      const transient = isTransient(err);
      if (attempt > maxRetries || !transient) {
        console.error(`❌ MongoDB connection failed (attempt ${attempt}). No more retries.`, err);
        throw err;
      }
      const delay = Math.min(baseDelay * Math.pow(factor, attempt - 1), maxDelay);
      console.warn(`⚠️ MongoDB connect attempt ${attempt} failed: ${err.message}. Retrying in ${delay} ms (${attempt}/${maxRetries})`);
      await new Promise(r => setTimeout(r, delay));
      return attemptConnect();
    }
  }

  return attemptConnect();
}

function isTransient(err) {
  if (!err) return true;
  const msg = err.message || '';
  // Basic heuristics; extend as needed
  return /(ECONNREFUSED|ENOTFOUND|ETIMEDOUT|EAI_AGAIN|ServerSelectionError|TopologyClosed|network error)/i.test(msg);
}

// Handle post-connect disconnections -> allow new retries on demand
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
  connectionPromise = null; // allow future reconnect attempts
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error event:', err.message);
});


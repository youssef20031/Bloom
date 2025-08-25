// Reusable MongoDB connection with retry logic
import mongoose from 'mongoose';

let connectionPromise = null;
let lastUri = null;
let lastOptions = null;
let autoReconnectTimer = null;
let autoReconnectAttempts = 0;
let autoReconnectInFlight = false;

// Read optional env overrides
const envInt = (name, def) => {
  const v = process.env[name];
  if (v === undefined || v === null || v === '') return def;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? def : n;
};

export async function connectWithRetry(uri, options = {}) {
  if (!uri) throw new Error('MongoDB URI is required');
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  lastUri = uri;
  lastOptions = options;

  let maxRetries = options.maxRetries ?? envInt('MONGO_MAX_RETRIES', 5);
  const baseDelay = options.baseDelay ?? envInt('MONGO_RETRY_BASE_MS', 500); // ms
  const factor = options.factor ?? Number(process.env.MONGO_RETRY_FACTOR || 1.8);
  const maxDelay = options.maxDelay ?? envInt('MONGO_MAX_DELAY_MS', 5000);
  const alwaysRetryServerSelection = options.alwaysRetryServerSelection ?? true;
  const jitterPct = options.jitterPct ?? Number(process.env.MONGO_RETRY_JITTER_PCT || 0.2); // 0.2 = ±20%

  if (maxRetries <= 0) {
    console.warn(`⚠️ maxRetries (${maxRetries}) <= 0 supplied; forcing to 1 so there is at least one attempt.`);
    maxRetries = 1;
  }

  const mongooseOptions = {
    autoIndex: false,
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 10,
    minPoolSize: 1,
    retryWrites: true,
    ...options.mongooseOptions,
  };

  console.log(`ℹ️ Mongo connect config -> maxRetries=${maxRetries} baseDelay=${baseDelay} factor=${factor} maxDelay=${maxDelay} jitterPct=${jitterPct} alwaysRetryServerSelection=${alwaysRetryServerSelection}`);

  let attempt = 0;

  async function attemptConnect() {
    attempt += 1;
    try {
      const start = Date.now();
      connectionPromise = mongoose.connect(uri, mongooseOptions);
      await connectionPromise;
      const ms = Date.now() - start;
      console.log(`✅ MongoDB connected after attempt ${attempt} in ${ms} ms`);
      autoReconnectAttempts = 0; // reset auto reconnect backoff on success
      return mongoose.connection;
    } catch (err) {
      connectionPromise = null;
      const transient = isTransient(err, { alwaysRetryServerSelection });
      console.warn(`🔍 Mongo connect failure classification attempt=${attempt} name=${err?.name} transient=${transient} message='${trimMsg(err?.message)}'`);
      if (!transient) {
        console.error(`❌ Non-transient MongoDB connection error (attempt ${attempt}) – aborting retries.`);
        throw err;
      }
      if (attempt >= maxRetries) {
        console.error(`❌ MongoDB connection failed (attempt ${attempt}). Exhausted ${maxRetries} retries.`);
        throw err;
      }
      const expDelay = Math.min(baseDelay * Math.pow(factor, attempt - 1), maxDelay);
      const jitter = expDelay * jitterPct * (Math.random() * 2 - 1); // +/- jitterPct
      const delay = Math.max(50, Math.round(expDelay + jitter));
      console.warn(`⚠️ Transient MongoDB connect failure attempt ${attempt}/${maxRetries}. Retrying in ${delay} ms`);
      await new Promise(r => setTimeout(r, delay));
      return attemptConnect();
    }
  }

  return attemptConnect();
}

function isTransient(err, { alwaysRetryServerSelection }) {
  if (!err) return true;
  const name = err.name || '';
  const msg = err.message || '';
  if (alwaysRetryServerSelection && name === 'MongooseServerSelectionError') return true;
  const patterns = [
    /ECONNREFUSED/i,
    /ENOTFOUND/i,
    /ETIMEDOUT/i,
    /EAI_AGAIN/i,
    /network error/i,
    /TopologyClosed/i,
    /ServerSelection/i,
    /Could not connect to any servers/i
  ];
  return patterns.some(p => p.test(name) || p.test(msg));
}

function trimMsg(m) {
  if (!m) return '';
  return m.length > 180 ? m.slice(0, 177) + '...' : m;
}

function scheduleAutoReconnect(reason) {
  const enabled = (process.env.MONGO_AUTO_RECONNECT || 'true').toLowerCase() !== 'false';
  if (!enabled) return;
  if (!lastUri) return;
  if (mongoose.connection.readyState === 1) return;
  if (autoReconnectInFlight) return;

  const maxAuto = envInt('MONGO_AUTO_RECONNECT_MAX_RETRIES', 0); // 0 = unlimited
  if (maxAuto > 0 && autoReconnectAttempts >= maxAuto) {
    console.error(`❌ Auto-reconnect abort: exceeded MONGO_AUTO_RECONNECT_MAX_RETRIES=${maxAuto}`);
    return;
  }
  autoReconnectAttempts += 1;
  const base = envInt('MONGO_AUTO_RECONNECT_BASE_MS', 1000);
  const factor = Number(process.env.MONGO_AUTO_RECONNECT_FACTOR || 2);
  const maxDelay = envInt('MONGO_AUTO_RECONNECT_MAX_DELAY_MS', 15000);
  const attempt = autoReconnectAttempts;
  const delay = Math.min(base * Math.pow(factor, attempt - 1), maxDelay);
  console.warn(`🔁 Scheduling auto-reconnect attempt ${attempt} in ${delay} ms (reason=${reason})`);
  clearTimeout(autoReconnectTimer);
  autoReconnectTimer = setTimeout(async () => {
    if (mongoose.connection.readyState === 1) return; // already connected meanwhile
    autoReconnectInFlight = true;
    try {
      await connectWithRetry(lastUri, { ...lastOptions, maxRetries: lastOptions.maxRetries ?? envInt('MONGO_MAX_RETRIES', 5) });
      console.log('✅ Auto-reconnect succeeded');
    } catch (err) {
      console.error(`❌ Auto-reconnect attempt ${attempt} failed: ${err.message}`);
      autoReconnectInFlight = false; // allow another schedule
      scheduleAutoReconnect('retry-failure');
      return;
    }
    autoReconnectInFlight = false;
  }, delay);
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
  connectionPromise = null;
  scheduleAutoReconnect('disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error event:', err.message);
  if (mongoose.connection.readyState !== 1) {
    scheduleAutoReconnect('error');
  }
});

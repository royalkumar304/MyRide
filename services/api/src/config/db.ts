import mongoose from 'mongoose';
import { ENV } from './env';

let isConnected = false;
let isInMemoryStoreActive = false;
let connectionError: string | null = null;

/**
 * Returns true if running in production mode (NODE_ENV === 'production')
 */
export function isProduction(): boolean {
  return (ENV.NODE_ENV || '').toLowerCase() === 'production';
}

/**
 * Validates whether the in-memory store is permitted.
 * - In production: STRICTLY PROHIBITED (always false).
 * - In development: Requires explicit USE_MEMORY_STORE=true flag.
 */
export function isMemoryStoreAllowed(): boolean {
  if (isProduction()) {
    return false;
  }
  return !!ENV.USE_MEMORY_STORE;
}

// Setup connection lifecycle event handlers for real-time health tracking
mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('⚠️ MongoDB connection lost. Database state is now disconnected.');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  connectionError = null;
  console.log('✅ MongoDB reconnected successfully.');
});

mongoose.connection.on('error', (err) => {
  connectionError = err.message || 'Mongoose connection error';
  console.error('❌ Mongoose error event:', connectionError);
});

/**
 * Connects to MongoDB database with strict environment safety:
 * - Production: Connects to MongoDB; throws and aborts if unavailable. Never falls back to memory.
 * - Development: Connects to MongoDB by default. Only uses memory store if USE_MEMORY_STORE=true is explicitly set.
 */
export async function connectDB(): Promise<void> {
  if (isConnected && (isInMemoryStoreActive || mongoose.connection.readyState === 1)) {
    return;
  }

  const isProd = isProduction();
  const allowMemoryStore = isMemoryStoreAllowed();

  // 1. Explicit in-memory store in development
  if (allowMemoryStore) {
    console.log('ℹ️ Development mode: Explicit USE_MEMORY_STORE=true flag detected.');
    console.log('ℹ️ Activating in-memory database store for development/testing.');
    isInMemoryStoreActive = true;
    isConnected = true;
    connectionError = null;
    return;
  }

  // 2. Production or default development: Connect to live MongoDB
  try {
    const timeoutMs = isProd ? 5000 : 3000;
    console.log(`🔌 Attempting connection to MongoDB (${isProd ? '[REDACTED_URI]' : ENV.MONGODB_URI})...`);

    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: timeoutMs,
    });

    isConnected = true;
    isInMemoryStoreActive = false;
    connectionError = null;
    console.log('✅ MongoDB connected successfully to:', isProd ? '[REDACTED_URI]' : ENV.MONGODB_URI);
  } catch (error: any) {
    connectionError = error.message || 'Unknown MongoDB connection error';
    isConnected = false;
    isInMemoryStoreActive = false;

    if (isProd) {
      console.error('❌ CRITICAL: MongoDB connection failed in production environment!');
      console.error(`❌ Error details: ${connectionError}`);
      console.error('❌ Production MUST NOT silently fall back to in-memory store.');
      throw new Error(`[Production Database Failure] Unable to connect to MongoDB: ${connectionError}`);
    } else {
      console.error('❌ MongoDB connection failed in development environment.');
      console.error(`❌ Error details: ${connectionError}`);
      console.error('ℹ️ To run with the mock in-memory store for local development, set USE_MEMORY_STORE=true in your environment.');
      throw new Error(`[Database Connection Error] MongoDB is unavailable (${connectionError}). Set USE_MEMORY_STORE=true to use in-memory store in development.`);
    }
  }
}

/**
 * Returns true if the in-memory store is currently active.
 * Guarantees that production NEVER returns true.
 */
export function isUsingMemoryStore(): boolean {
  if (isProduction()) {
    return false;
  }
  return isInMemoryStoreActive;
}

/**
 * Comprehensive diagnostic database health status for /health endpoint
 */
export function getDatabaseStatus(): {
  isHealthy: boolean;
  status: 'connected' | 'in_memory' | 'disconnected' | 'error';
  mode: 'mongodb' | 'memory';
  isProduction: boolean;
  readyState: number;
  uri?: string;
  error?: string | null;
} {
  const isProd = isProduction();
  const readyState = mongoose.connection.readyState;

  if (isUsingMemoryStore()) {
    return {
      isHealthy: !isProd, // Unhealthy if somehow invoked in production
      status: 'in_memory',
      mode: 'memory',
      isProduction: isProd,
      readyState: 0,
      error: null,
    };
  }

  const isMongooseConnected = readyState === 1;

  return {
    isHealthy: isMongooseConnected,
    status: isMongooseConnected ? 'connected' : (connectionError ? 'error' : 'disconnected'),
    mode: 'mongodb',
    isProduction: isProd,
    readyState,
    uri: isProd ? '[REDACTED_MONGODB_URI]' : ENV.MONGODB_URI,
    error: isMongooseConnected ? null : connectionError,
  };
}

/**
 * Disconnects and resets database connection state (useful for graceful shutdown & test teardown)
 */
export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  isConnected = false;
  isInMemoryStoreActive = false;
  connectionError = null;
}


import mongoose from 'mongoose';
import { ENV } from './env';

let isConnected = false;
let isInMemoryFallback = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  try {
    // Attempt MongoDB connection with 2s timeout
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    isConnected = true;
    console.log('✅ MongoDB connected successfully to:', ENV.MONGODB_URI);
  } catch (error: any) {
    console.warn(`⚠️ MongoDB connection unavailable (${error.message}).`);
    console.log('ℹ️ Activating resilient in-memory database store for seamless local execution.');
    isInMemoryFallback = true;
    isConnected = true;
  }
}

export function isUsingMemoryStore(): boolean {
  return isInMemoryFallback;
}

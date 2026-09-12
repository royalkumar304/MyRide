import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or local
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/myride',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_local_fallback_secret_change_in_env',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'myride-assets',
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  EXPOSE_DEV_OTP: process.env.NODE_ENV !== 'production' && process.env.EXPOSE_DEV_OTP !== 'false',
  USE_MEMORY_STORE: process.env.USE_MEMORY_STORE === 'true' || process.env.USE_MEMORY_STORE === '1',
  BOOKING_PAYMENT_HOLD_MINUTES: parseInt(process.env.BOOKING_PAYMENT_HOLD_MINUTES || '15', 10),
};

if ((ENV.NODE_ENV || '').toLowerCase() === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('[Production Security Exception] A strong JWT_SECRET (minimum 32 characters) must be configured in environment variables.');
  }
  if (!process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET.length < 16) {
    throw new Error('[Production Security Exception] A dedicated RAZORPAY_WEBHOOK_SECRET (minimum 16 characters) must be configured in production environment variables.');
  }
  const disallowed = ['mock', 'test', 'secret', 'default', 'change-me', 'change_me_to_a_random_webhook_secret'];
  if (disallowed.includes((process.env.RAZORPAY_WEBHOOK_SECRET || '').toLowerCase())) {
    throw new Error('[Production Security Exception] Insecure fallback RAZORPAY_WEBHOOK_SECRET is not permitted in production.');
  }
}

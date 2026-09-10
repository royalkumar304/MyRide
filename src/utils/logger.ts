/**
 * Environment-Aware Logger for MyRide
 * 
 * Development:
 * - Allows useful console logging for network, state, and UI lifecycles.
 * 
 * Production:
 * - Strictly prevents logging or leaking of:
 *   - JWT access / refresh tokens
 *   - OTP codes
 *   - Payment secrets, signatures, and transaction credentials
 *   - Personal sensitive data (passwords, card CVV, KYC documents)
 */

declare const __DEV__: boolean | undefined;

export const isDevelopment = (): boolean => {
  if (typeof __DEV__ !== 'undefined') {
    return !!__DEV__;
  }
  return process.env.NODE_ENV !== 'production';
};

const SENSITIVE_KEY_PATTERNS = [
  /token/i,
  /jwt/i,
  /otp/i,
  /password/i,
  /secret/i,
  /signature/i,
  /razorpay/i,
  /authorization/i,
  /bearer/i,
  /card/i,
  /cvv/i,
  /pan/i,
  /aadhaar/i,
  /apikey/i,
  /api_key/i,
  /credential/i,
];

const JWT_REGEX = /ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g;
const OTP_REGEX = /\b(otp|code)[:=\s]+["']?(\d{4,6})["']?/gi;
const BEARER_REGEX = /Bearer\s+[A-Za-z0-9._-]+/gi;
const RAZORPAY_SIG_REGEX = /\b(razorpaySignature|razorpay_signature)[:=\s]+["']?([a-f0-9]{32,})["']?/gi;

/**
 * Sanitizes any value (string, object, array) by masking sensitive tokens and secrets
 */
export function sanitizeLogData<T = any>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return data
      .replace(JWT_REGEX, '[REDACTED_JWT]')
      .replace(BEARER_REGEX, 'Bearer [REDACTED_TOKEN]')
      .replace(OTP_REGEX, '$1: [REDACTED_OTP]')
      .replace(RAZORPAY_SIG_REGEX, '$1: [REDACTED_SIGNATURE]') as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const isSensitiveKey = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
      if (isSensitiveKey && value !== null && value !== undefined) {
        sanitized[key] = '[REDACTED_SENSITIVE]';
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeLogData(value);
      } else if (typeof value === 'string') {
        sanitized[key] = sanitizeLogData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized as unknown as T;
  }

  return data;
}

export const logger = {
  debug(...args: any[]): void {
    if (isDevelopment()) {
      console.log('[DEBUG]', ...args);
    }
  },

  info(...args: any[]): void {
    if (isDevelopment()) {
      console.info('[INFO]', ...args);
    } else {
      const sanitizedArgs = args.map((arg) => sanitizeLogData(arg));
      console.info('[INFO]', ...sanitizedArgs);
    }
  },

  warn(...args: any[]): void {
    if (isDevelopment()) {
      console.warn('[WARN]', ...args);
    } else {
      const sanitizedArgs = args.map((arg) => sanitizeLogData(arg));
      console.warn('[WARN]', ...sanitizedArgs);
    }
  },

  error(...args: any[]): void {
    if (isDevelopment()) {
      console.error('[ERROR]', ...args);
    } else {
      const sanitizedArgs = args.map((arg) => sanitizeLogData(arg));
      console.error('[ERROR]', ...sanitizedArgs);
    }
  },

  sanitize: sanitizeLogData,
};

export default logger;

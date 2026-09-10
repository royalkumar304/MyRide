/**
 * Centralized Error Handling for MyRide
 * Standardizes API status codes, network errors, and ensures raw stack traces are NEVER displayed.
 */

export const STATUS_ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input.',
  401: 'Your session has expired. Please log in again.',
  403: "You don't have permission to perform this action.",
  404: 'Requested data was not found.',
  408: 'Request timed out. Please check your internet connection.',
  409: 'This vehicle is no longer available.',
  422: 'Validation error. Please verify the provided details.',
  429: 'Too many requests. Please slow down and try again shortly.',
  500: 'Something went wrong. Please try again.',
  502: 'Unable to connect to MyRide. Check your internet connection.',
  503: 'Server is temporarily unavailable. Please try again.',
  504: 'Request timed out. Please check your internet connection.',
};

export const NETWORK_ERROR_MESSAGE = 'Unable to connect to MyRide. Check your internet connection.';

/**
 * Patterns that indicate raw stack traces or internal technical errors
 */
const TECHNICAL_ERROR_PATTERNS = [
  /\bat\s+.+:\d+:\d+/i, // e.g. "at Object.<anonymous> (/app/src/...:12:34)"
  /\bat\s+async\s+/i,
  /node_modules/i,
  /CastError/i,
  /Cast to ObjectId/i,
  /MongoError/i,
  /MongoServerError/i,
  /MongooseError/i,
  /E11000 duplicate key/i,
  /TypeError:/i,
  /ReferenceError:/i,
  /SyntaxError:/i,
  /RangeError:/i,
  /UnhandledPromiseRejection/i,
  /JSON\.parse/i,
  /Unexpected token/i,
  /webpack-internal/i,
  /Cannot read propert/i,
  /is not a function/i,
  /undefined is not an object/i,
  /null is not an object/i,
];

/**
 * Checks if a message contains raw stack traces or internal engine errors
 */
export function containsRawStackTrace(message: string): boolean {
  if (!message || typeof message !== 'string') return false;
  return TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Determines whether the given error represents a network or connectivity failure
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;

  if (error.isNetworkError || error.isTimeout) return true;

  const msg = typeof error === 'string' ? error : error?.message || '';
  const code = error?.code || error?.errorCode || '';

  const networkTokens = [
    'network',
    'network request failed',
    'failed to fetch',
    'econnrefused',
    'econnreset',
    'etimedout',
    'aborterror',
    'timeout',
    'socket hang up',
    'offline',
    'internet connection',
    'unable to connect',
  ];

  return (
    networkTokens.some((token) => msg.toLowerCase().includes(token)) ||
    networkTokens.some((token) => String(code).toLowerCase().includes(token)) ||
    error?.statusCode === 0 ||
    error?.statusCode === 408
  );
}

/**
 * Cleans an error string by stripping HTML tags and excess whitespace
 */
function sanitizeString(str: string): string {
  if (!str) return '';
  return str.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
}

/**
 * Centralized error resolver:
 * - Maps standard status codes (401, 403, 404, 409, 500, etc.)
 * - Maps network & timeout failures
 * - Strips and sanitizes raw stack traces
 * - Preserves friendly backend business validation messages (e.g. "Valid 10-digit mobile number required")
 */
export function getFriendlyErrorMessage(error: any, statusCode?: number): string {
  // If explicitly network error
  if (isNetworkError(error)) {
    return NETWORK_ERROR_MESSAGE;
  }

  const effectiveStatus = statusCode ?? error?.statusCode ?? (typeof error === 'number' ? error : undefined);

  // If status is 401
  if (effectiveStatus === 401) {
    return STATUS_ERROR_MESSAGES[401];
  }

  // If status is 403
  if (effectiveStatus === 403) {
    return STATUS_ERROR_MESSAGES[403];
  }

  // Extract raw message candidates
  let rawMsg = '';
  if (typeof error === 'string') {
    rawMsg = error;
  } else if (error?.response?.data?.message) {
    rawMsg = error.response.data.message;
  } else if (error?.message) {
    rawMsg = error.message;
  } else if (error?.error && typeof error.error === 'string') {
    rawMsg = error.error;
  }

  const cleanMsg = sanitizeString(rawMsg);

  // If message contains raw stack trace or internal crash info, replace with friendly status error
  if (containsRawStackTrace(cleanMsg)) {
    if (effectiveStatus && STATUS_ERROR_MESSAGES[effectiveStatus]) {
      return STATUS_ERROR_MESSAGES[effectiveStatus];
    }
    return STATUS_ERROR_MESSAGES[500];
  }

  // If cleanMsg matches known HTTP status codes or generic "Request failed"
  if (
    cleanMsg.toLowerCase().includes('not found') ||
    cleanMsg.toLowerCase().includes('cannot find') ||
    effectiveStatus === 404
  ) {
    return STATUS_ERROR_MESSAGES[404];
  }

  if (
    cleanMsg.toLowerCase().includes('already booked') ||
    cleanMsg.toLowerCase().includes('no longer available') ||
    cleanMsg.toLowerCase().includes('conflict') ||
    effectiveStatus === 409
  ) {
    return STATUS_ERROR_MESSAGES[409];
  }

  if (effectiveStatus && effectiveStatus >= 500) {
    return STATUS_ERROR_MESSAGES[500];
  }

  // If message is clean, friendly, and readable, preserve it (e.g., specific validation or business messages)
  if (cleanMsg.length > 0 && !cleanMsg.startsWith('HTTP ') && !cleanMsg.startsWith('[object')) {
    return cleanMsg;
  }

  // Fallback to status dictionary or generic 500
  if (effectiveStatus && STATUS_ERROR_MESSAGES[effectiveStatus]) {
    return STATUS_ERROR_MESSAGES[effectiveStatus];
  }

  return STATUS_ERROR_MESSAGES[500];
}

/**
 * Complete error report helper for UI screens and logging
 */
export function handleApiError(error: any, statusCode?: number): {
  message: string;
  isNetwork: boolean;
  statusCode: number;
} {
  const isNetwork = isNetworkError(error);
  const effectiveStatus = statusCode ?? error?.statusCode ?? (isNetwork ? 0 : 500);
  const message = getFriendlyErrorMessage(error, effectiveStatus);

  return {
    message,
    isNetwork,
    statusCode: effectiveStatus,
  };
}

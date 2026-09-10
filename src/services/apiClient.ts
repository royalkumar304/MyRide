import { Platform } from 'react-native';
import { APP_CONFIG } from '../constants/config';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
  raw?: any;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  timeoutMs?: number;
  skipAuth?: boolean;
  throwOnError?: boolean;
}

export type UnauthorizedCallback = () => void;

/**
 * Structured API Error class providing detailed diagnostic properties
 */
export class ApiError extends Error {
  public statusCode: number;
  public errorCode?: string;
  public rawResponse?: any;
  public isNetworkError: boolean;
  public isTimeout: boolean;
  public isUnauthorized: boolean;

  constructor(params: {
    message: string;
    statusCode?: number;
    errorCode?: string;
    rawResponse?: any;
    isNetworkError?: boolean;
    isTimeout?: boolean;
    isUnauthorized?: boolean;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.statusCode = params.statusCode ?? 500;
    this.errorCode = params.errorCode;
    this.rawResponse = params.rawResponse;
    this.isNetworkError = !!params.isNetworkError;
    this.isTimeout = !!params.isTimeout;
    this.isUnauthorized = !!params.isUnauthorized;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Extracts human-readable error messages from various backend error shapes
 * Supports Zod validation issues, Mongoose errors, and string errors
 */
function extractErrorMessage(parsedBody: any, defaultMessage: string): string {
  if (!parsedBody) return defaultMessage;
  if (typeof parsedBody === 'string') {
    // Strip HTML tags if HTML error page was returned
    const clean = parsedBody.replace(/<[^>]*>?/gm, '').trim();
    return clean.length > 0 ? (clean.length > 150 ? clean.substring(0, 150) + '...' : clean) : defaultMessage;
  }
  if (parsedBody.message && typeof parsedBody.message === 'string') {
    return parsedBody.message;
  }
  if (parsedBody.error && typeof parsedBody.error === 'string') {
    return parsedBody.error;
  }
  if (Array.isArray(parsedBody.errors) && parsedBody.errors.length > 0) {
    return parsedBody.errors
      .map((e: any) => (e.path ? `${Array.isArray(e.path) ? e.path.join('.') : e.path}: ${e.message}` : e.message || String(e)))
      .join(', ');
  }
  return defaultMessage;
}

/**
 * Safely parses response body without crashing on non-JSON, HTML, or malformed JSON
 */
async function safelyParseResponseBody(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      const text = await response.text();
      if (!text || text.trim() === '') return null;
      return JSON.parse(text);
    } else {
      const text = await response.text();
      if (!text || text.trim() === '') return null;
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
  } catch (err) {
    return { parseError: true, raw: 'Failed to parse response payload' };
  }
}

/**
 * Automatically normalizes common backend response wrappers
 * e.g. { success: true, vehicles: [...] } or { success: true, vehicle: {...} }
 */
function normalizePayload<T>(parsedBody: any): T {
  if (!parsedBody || typeof parsedBody !== 'object') {
    return parsedBody as T;
  }

  // Preserve the full parsed object by default so services accessing specific properties work seamlessly
  const target: any = { ...parsedBody };

  // If there's an explicit data field, prioritize it
  if (parsedBody.data !== undefined) {
    target.data = parsedBody.data;
  }

  // Convenience extraction for common entity keys
  const primaryKeys = [
    'vehicles',
    'vehicle',
    'bookings',
    'booking',
    'user',
    'stats',
    'earnings',
    'order',
    'cities',
    'reviews',
    'review',
    'breakdown',
  ];

  for (const key of primaryKeys) {
    if (parsedBody[key] !== undefined && target[key] === undefined) {
      target[key] = parsedBody[key];
    }
  }

  return target as T;
}

class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;
  private defaultTimeoutMs: number = 12000;
  private unauthorizedListeners: Set<UnauthorizedCallback> = new Set();

  constructor() {
    this.baseUrl = this.resolveDefaultBaseUrl();
  }

  /**
   * Platform-aware dynamic base URL resolution
   */
  private resolveDefaultBaseUrl(): string {
    // 1. Prioritize Expo Public API URL environment variable
    if (process.env.EXPO_PUBLIC_API_URL) {
      return process.env.EXPO_PUBLIC_API_URL;
    }
    if (process.env.EXPO_PUBLIC_API_BASE_URL) {
      return process.env.EXPO_PUBLIC_API_BASE_URL;
    }
    // 2. Configurable fallback from APP_CONFIG
    if (APP_CONFIG.apiBaseUrl && !APP_CONFIG.apiBaseUrl.includes('api.myride.in')) {
      return APP_CONFIG.apiBaseUrl;
    }
    // 3. Platform-aware fallbacks for local development
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5000/api/v1';
    }
    return 'http://localhost:5000/api/v1';
  }

  // Base URL Configuration
  public setBaseUrl(url: string): void {
    this.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  // Token Management & Injection
  public setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  public getAuthToken(): string | null {
    return this.authToken;
  }

  // 401 Unauthorized Listeners
  public onUnauthorized(callback: UnauthorizedCallback): () => void {
    this.unauthorizedListeners.add(callback);
    return () => {
      this.unauthorizedListeners.delete(callback);
    };
  }

  private notifyUnauthorized(): void {
    this.authToken = null;
    this.unauthorizedListeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('[ApiClient] Error in unauthorized listener:', err);
      }
    });
  }

  /**
   * Core request method:
   * - Never crashes on malformed JSON
   * - Preserves backend error messages
   * - Automatically injects token
   * - Handles timeouts and 401s
   * - Returns normalized typed data
   */
  public async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      body,
      headers: customHeaders = {},
      timeoutMs = this.defaultTimeoutMs,
      skipAuth = false,
      throwOnError = false,
      ...customOptions
    } = options;

    const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(!skipAuth && this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
        ...(customHeaders as Record<string, string>),
      };

      const requestInit: RequestInit = {
        ...customOptions,
        headers,
        signal: controller.signal,
      };

      if (body !== undefined) {
        requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const response = await fetch(url, requestInit);
      clearTimeout(timeoutId);

      // Safe body parsing
      const parsedBody = await safelyParseResponseBody(response);

      // 401 Handling
      if (response.status === 401) {
        this.notifyUnauthorized();
        const errorMessage = extractErrorMessage(
          parsedBody,
          'Session expired or unauthorized. Please log in again.'
        );

        const errorObj = new ApiError({
          message: errorMessage,
          statusCode: 401,
          errorCode: 'UNAUTHORIZED',
          rawResponse: parsedBody,
          isUnauthorized: true,
        });

        if (throwOnError) throw errorObj;

        return {
          success: false,
          statusCode: 401,
          message: errorMessage,
          error: 'UNAUTHORIZED',
          raw: parsedBody,
        };
      }

      // Non-2xx HTTP errors
      if (!response.ok) {
        const defaultMsg = `HTTP ${response.status}: ${response.statusText || 'Request failed'}`;
        const errorMessage = extractErrorMessage(parsedBody, defaultMsg);

        const errorObj = new ApiError({
          message: errorMessage,
          statusCode: response.status,
          errorCode: typeof parsedBody?.error === 'string' ? parsedBody.error : `HTTP_${response.status}`,
          rawResponse: parsedBody,
        });

        if (throwOnError) throw errorObj;

        return {
          success: false,
          statusCode: response.status,
          message: errorMessage,
          error: errorObj.errorCode,
          data: parsedBody as T,
          raw: parsedBody,
        };
      }

      // Success
      const normalizedData = normalizePayload<T>(parsedBody);
      return {
        success: true,
        statusCode: response.status,
        data: normalizedData,
        message: typeof parsedBody?.message === 'string' ? parsedBody.message : undefined,
        raw: parsedBody,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err instanceof ApiError) {
        if (throwOnError) throw err;
        return {
          success: false,
          statusCode: err.statusCode,
          message: err.message,
          error: err.errorCode,
          raw: err.rawResponse,
        };
      }

      const isTimeout = err.name === 'AbortError';
      const errorMessage = isTimeout
        ? `Request timed out after ${timeoutMs}ms. Please check server reachability.`
        : err.message || 'Network error. Please verify your connection.';

      const errorObj = new ApiError({
        message: errorMessage,
        statusCode: isTimeout ? 408 : 0,
        errorCode: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
        isTimeout,
        isNetworkError: !isTimeout,
      });

      if (throwOnError) throw errorObj;

      return {
        success: false,
        statusCode: errorObj.statusCode,
        message: errorMessage,
        error: errorObj.errorCode,
      };
    }
  }

  /**
   * Executes request and returns typed data directly, throwing ApiError if unsuccessful
   */
  public async fetchOrThrow<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const res = await this.request<T>(endpoint, { ...options, throwOnError: true });
    return res.data as T;
  }

  // Convenience HTTP Methods
  public get<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  public put<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  public patch<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  public delete<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;

// Convenience function exports
export const setAuthToken = (token: string | null) => apiClient.setAuthToken(token);
export const getAuthToken = () => apiClient.getAuthToken();
export const setApiBaseUrl = (url: string) => apiClient.setBaseUrl(url);
export const getApiBaseUrl = () => apiClient.getBaseUrl();
export const apiFetch = <T = any>(endpoint: string, options?: RequestOptions) => apiClient.request<T>(endpoint, options);
export const apiGet = <T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) => apiClient.get<T>(endpoint, options);
export const apiPost = <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) => apiClient.post<T>(endpoint, body, options);
export const apiPut = <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) => apiClient.put<T>(endpoint, body, options);
export const apiPatch = <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) => apiClient.patch<T>(endpoint, body, options);
export const apiDelete = <T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) => apiClient.delete<T>(endpoint, options);
export const fetchOrThrow = <T = any>(endpoint: string, options?: RequestOptions) => apiClient.fetchOrThrow<T>(endpoint, options);

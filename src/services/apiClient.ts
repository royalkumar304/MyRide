import { Platform } from 'react-native';
import { APP_CONFIG } from '../constants/config';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  timeoutMs?: number;
  skipAuth?: boolean;
}

export type UnauthorizedCallback = () => void;

class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;
  private defaultTimeoutMs: number = 12000;
  private unauthorizedListeners: Set<UnauthorizedCallback> = new Set();

  constructor() {
    this.baseUrl = this.resolveDefaultBaseUrl();
  }

  /**
   * Platform-aware dynamic base URL resolution:
   * - Android Emulator needs 10.0.2.2 to reach host machine localhost
   * - iOS Simulator and Web use localhost directly
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
   * Core request method handling JSON, headers, timeout, response parsing, and error normalization
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

      // Parse JSON response safely
      let parsedBody: any = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        parsedBody = await response.json().catch(() => null);
      } else {
        const text = await response.text().catch(() => '');
        try {
          parsedBody = JSON.parse(text);
        } catch {
          parsedBody = text ? { raw: text } : null;
        }
      }

      // Handle 401 Unauthorized
      if (response.status === 401) {
        this.notifyUnauthorized();
        return {
          success: false,
          statusCode: 401,
          message: parsedBody?.message || 'Session expired or unauthorized. Please log in again.',
          error: 'UNAUTHORIZED',
        };
      }

      // Handle other non-2xx HTTP errors
      if (!response.ok) {
        const errorMessage =
          parsedBody?.message ||
          parsedBody?.error ||
          `HTTP ${response.status}: ${response.statusText || 'Request failed'}`;

        return {
          success: false,
          statusCode: response.status,
          message: errorMessage,
          error: parsedBody?.error || errorMessage,
          data: parsedBody,
        };
      }

      // Successful response
      const responseData = parsedBody?.data !== undefined ? parsedBody.data : parsedBody;
      return {
        success: true,
        statusCode: response.status,
        data: responseData as T,
        message: parsedBody?.message,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        const timeoutMessage = `Request timed out after ${timeoutMs}ms. Please check your network connection or server status.`;
        return {
          success: false,
          statusCode: 408,
          message: timeoutMessage,
          error: 'TIMEOUT',
        };
      }

      const networkMessage = err.message || 'Network request failed. Please check your connection.';
      return {
        success: false,
        statusCode: 0,
        message: networkMessage,
        error: 'NETWORK_ERROR',
      };
    }
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

// Convenience function exports matching standard API patterns
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

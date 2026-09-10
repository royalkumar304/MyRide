import { Platform } from 'react-native';
import { APP_CONFIG } from '../../constants/config';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Platform-aware dynamic base URL:
// - Android Emulator requires 10.0.2.2 to reach host machine localhost
// - iOS Simulator and Web use localhost directly
const resolveDefaultBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  if (APP_CONFIG.apiBaseUrl && !APP_CONFIG.apiBaseUrl.includes('api.myride.in')) {
    return APP_CONFIG.apiBaseUrl;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/v1';
  }
  return 'http://localhost:5000/api/v1';
};

let currentBaseUrl = resolveDefaultBaseUrl();
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

export const setApiBaseUrl = (url: string) => {
  currentBaseUrl = url;
};

export const getApiBaseUrl = () => currentBaseUrl;

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('http') ? endpoint : `${currentBaseUrl}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    };

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: json.message || `Request failed with status ${response.status}`,
        error: json.error || json.message || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      data: json.data !== undefined ? json.data : (json as T),
      message: json.message,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    const isTimeout = error.name === 'AbortError';
    const message = isTimeout
      ? 'Connection timed out. Please verify backend server is running.'
      : error.message || 'Network request failed';

    return {
      success: false,
      error: message,
      message,
    };
  }
}

export const apiGet = <T>(endpoint: string, headers?: Record<string, string>) =>
  apiFetch<T>(endpoint, { method: 'GET', headers });

export const apiPost = <T>(endpoint: string, body?: any, headers?: Record<string, string>) =>
  apiFetch<T>(endpoint, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers,
  });

export const apiPut = <T>(endpoint: string, body?: any, headers?: Record<string, string>) =>
  apiFetch<T>(endpoint, {
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers,
  });

export const apiDelete = <T>(endpoint: string, headers?: Record<string, string>) =>
  apiFetch<T>(endpoint, { method: 'DELETE', headers });

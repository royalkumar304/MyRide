import { APP_CONFIG } from '../constants/config';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

let authToken: string | null = 'mock_jwt_token_user_123';

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

// Simulated API network call helper with realistic network latency (200-400ms)
export async function mockApiCall<T>(data: T, delayMs: number = 300, shouldFail: boolean = false): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error('Network error. Please check your internet connection.'));
      } else {
        resolve({
          success: true,
          data,
          message: 'Operation completed successfully',
        });
      }
    }, delayMs);
  });
}

// Live Backend API connection
export const API_BASE_URL = 'http://localhost:5000/api/v1';

export async function liveApiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
    });
    const json = await res.json();
    return { success: res.ok, data: json, message: json.message };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}


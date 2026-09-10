export * from './api/client';
export * from './api/adapters';

import { ApiResponse } from './api/client';

// Simulated API helper preserved for explicit mock/testing workflows
export async function mockApiCall<T>(
  data: T,
  delayMs: number = 250,
  shouldFail: boolean = false
): Promise<ApiResponse<T>> {
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

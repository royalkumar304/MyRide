import { User, UserRole } from '../types';
import { apiClient, setAuthToken, ApiResponse } from './apiClient';
import { adaptBackendUserToMobile } from './api/adapters';
import { tokenStorage } from './tokenStorage';
import { mockAuthService, INITIAL_MOCK_USER } from './mock/mockAuthService';
import { logger } from '../utils/logger';

export { INITIAL_MOCK_USER };

/**
 * Authentication Service
 * Connects the mobile app to backend endpoints:
 * - POST /auth/send-otp
 * - POST /auth/verify-otp
 * - POST /auth/signup
 * - GET  /auth/me
 */
export const authService = {
  /**
   * Request an OTP for authentication / login via POST /auth/send-otp.
   * In production, OTP values are never exposed in the response payload.
   */
  async sendOtp(phoneNumber: string): Promise<ApiResponse<{
    otpSent: boolean;
    message: string;
    otp?: string;
    sentViaSms?: boolean;
    provider?: string;
  }>> {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      provider?: string;
      sentViaSms?: boolean;
      otp?: string;
    }>('/auth/send-otp', { phone: cleanPhone });

    if (response.success && response.data) {
      return {
        success: true,
        data: {
          otpSent: true,
          message: response.data.message || `OTP sent to +91 ${cleanPhone}`,
          // In production, backend omits OTP. Only included if dev flag is enabled on server.
          otp: response.data.otp,
          sentViaSms: response.data.sentViaSms,
          provider: response.data.provider,
        },
      };
    }

    // Fallback to mock service if backend is offline or unreachable
    logger.warn('[authService.sendOtp] Live API unreachable or failed. Falling back to mock.');
    return mockAuthService.sendOtp(phoneNumber);
  },

  /**
   * Verify an OTP and retrieve authenticated session via POST /auth/verify-otp.
   */
  async verifyOtp(
    phoneNumber: string,
    otp: string
  ): Promise<ApiResponse<{ user: User; token: string; requiresSignup?: boolean }>> {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    const response = await apiClient.post<{
      success: boolean;
      token?: string;
      user?: any;
      requiresSignup?: boolean;
      message?: string;
    }>('/auth/verify-otp', { phone: cleanPhone, otp });

    if (response.success && response.data) {
      if (response.data.requiresSignup) {
        return {
          success: true,
          data: {
            user: {
              id: 'temp_' + cleanPhone,
              fullName: 'New MyRide User',
              email: '',
              phoneNumber: `+91 ${cleanPhone}`,
              city: 'Lucknow',
              activeRole: 'CUSTOMER',
              isKycVerified: false,
              drivingLicenseVerified: false,
              referralCode: `MYR${cleanPhone.slice(-4)}`,
              createdAt: new Date().toISOString(),
            },
            token: '',
            requiresSignup: true,
          },
          message: response.data.message || 'Phone verified. Please complete signup.',
        };
      }

      if (response.data.token) {
        setAuthToken(response.data.token);
        await tokenStorage.saveToken(response.data.token);
      }

      const user: User = response.data.user
        ? adaptBackendUserToMobile(response.data.user)
        : {
            id: 'usr_' + cleanPhone,
            fullName: 'MyRide User',
            email: '',
            phoneNumber: `+91 ${cleanPhone}`,
            city: 'Lucknow',
            activeRole: 'CUSTOMER',
            isKycVerified: false,
            drivingLicenseVerified: false,
            referralCode: `MYR${cleanPhone.slice(-4)}`,
            createdAt: new Date().toISOString(),
          };

      if (response.data.token) {
        await tokenStorage.saveSession(response.data.token, user);
      }

      return {
        success: true,
        data: {
          user,
          token: response.data.token || '',
        },
      };
    }

    logger.warn('[authService.verifyOtp] Live API failed or offline. Using mockAuthService fallback.');
    return mockAuthService.verifyOtp(phoneNumber, otp);
  },

  /**
   * Register a new user profile and issue JWT via POST /auth/signup.
   */
  async signup(data: {
    fullName: string;
    phoneNumber: string;
    email: string;
    city: string;
    initialRole: UserRole;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    const cleanPhone = data.phoneNumber.replace(/\D/g, '').slice(-10);
    const response = await apiClient.post<{
      success: boolean;
      token?: string;
      user?: any;
      message?: string;
    }>('/auth/signup', {
      name: data.fullName,
      phone: cleanPhone,
      email: data.email,
      city: data.city,
      role: data.initialRole,
    });

    if (response.success && response.data && response.data.token) {
      setAuthToken(response.data.token);
      const user = adaptBackendUserToMobile(response.data.user);
      await tokenStorage.saveSession(response.data.token, user);

      return {
        success: true,
        data: {
          user,
          token: response.data.token,
        },
      };
    }

    logger.warn('[authService.signup] Live API failed. Using mockAuthService fallback.');
    return mockAuthService.signup(data);
  },

  /**
   * Retrieves the currently authenticated user profile via GET /auth/me.
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await apiClient.get<{ success: boolean; user: any }>('/auth/me');
    if (response.success && response.data?.user) {
      const user = adaptBackendUserToMobile(response.data.user);
      // Cache fresh user profile
      await tokenStorage.setStoredUser(user);
      return {
        success: true,
        data: user,
      };
    }
    return {
      success: false,
      message: response.message || 'Unable to retrieve authenticated user profile',
      error: response.error || 'GET_PROFILE_FAILED',
      statusCode: response.statusCode,
    };
  },

  /**
   * Alias for getCurrentUser()
   */
  async getProfile(): Promise<ApiResponse<User>> {
    return this.getCurrentUser();
  },

  /**
   * Logs out the user by clearing secure tokens and ApiClient state
   */
  async logout(): Promise<ApiResponse<{ loggedOut: boolean }>> {
    try {
      await tokenStorage.clearSession();
      setAuthToken(null);
      return {
        success: true,
        data: { loggedOut: true },
        message: 'Logged out successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error during logout',
      };
    }
  },

  async switchRole(currentRole: UserRole): Promise<ApiResponse<{ activeRole: UserRole }>> {
    return mockAuthService.switchRole(currentRole);
  },

  async updateKyc(licenseNumber: string): Promise<ApiResponse<Partial<User>>> {
    return mockAuthService.updateKyc(licenseNumber);
  },
};

export default authService;

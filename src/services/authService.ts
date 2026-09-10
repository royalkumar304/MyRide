import { User, UserRole } from '../types';
import { apiPost, apiGet, setAuthToken, ApiResponse, adaptBackendUserToMobile } from './api';
import { mockAuthService, INITIAL_MOCK_USER } from './mock/mockAuthService';

export { INITIAL_MOCK_USER };

export const authService = {
  async sendOtp(phoneNumber: string): Promise<ApiResponse<{ otpSent: boolean; message: string; otp?: string; sentViaSms?: boolean; provider?: string }>> {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    const response = await apiPost<{
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
          otp: response.data.otp,
          sentViaSms: response.data.sentViaSms,
          provider: response.data.provider,
        },
      };
    }

    // Fallback to mock service if backend is offline or unreachable
    console.warn('[authService.sendOtp] Live API unreachable or failed. Falling back to mock.');
    return mockAuthService.sendOtp(phoneNumber);
  },

  async verifyOtp(phoneNumber: string, otp: string): Promise<ApiResponse<{ user: User; token: string; requiresSignup?: boolean }>> {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    const response = await apiPost<{
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
              ...INITIAL_MOCK_USER,
              phoneNumber: `+91 ${cleanPhone}`,
              fullName: 'New MyRide User',
            },
            token: '',
            requiresSignup: true,
          },
          message: response.data.message || 'Phone verified. Please complete signup.',
        };
      }

      if (response.data.token) {
        setAuthToken(response.data.token);
      }

      const user = response.data.user
        ? adaptBackendUserToMobile(response.data.user)
        : { ...INITIAL_MOCK_USER, phoneNumber: `+91 ${cleanPhone}` };

      return {
        success: true,
        data: {
          user,
          token: response.data.token || 'jwt_token_' + Date.now(),
        },
      };
    }

    console.warn('[authService.verifyOtp] Live API failed or offline. Using mockAuthService fallback.');
    return mockAuthService.verifyOtp(phoneNumber, otp);
  },

  async signup(data: {
    fullName: string;
    phoneNumber: string;
    email: string;
    city: string;
    initialRole: UserRole;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    const cleanPhone = data.phoneNumber.replace(/\D/g, '').slice(-10);
    const response = await apiPost<{
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
      return {
        success: true,
        data: {
          user,
          token: response.data.token,
        },
      };
    }

    console.warn('[authService.signup] Live API failed. Using mockAuthService fallback.');
    return mockAuthService.signup(data);
  },

  async getProfile(): Promise<ApiResponse<User>> {
    const response = await apiGet<{ success: boolean; user: any }>('/auth/me');
    if (response.success && response.data?.user) {
      return {
        success: true,
        data: adaptBackendUserToMobile(response.data.user),
      };
    }
    return {
      success: true,
      data: INITIAL_MOCK_USER,
    };
  },

  async switchRole(currentRole: UserRole): Promise<ApiResponse<{ activeRole: UserRole }>> {
    return mockAuthService.switchRole(currentRole);
  },

  async updateKyc(licenseNumber: string): Promise<ApiResponse<Partial<User>>> {
    return mockAuthService.updateKyc(licenseNumber);
  },
};

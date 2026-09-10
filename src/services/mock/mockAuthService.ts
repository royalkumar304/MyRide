import { User, UserRole } from '../../types';
import { mockApiCall, ApiResponse, setAuthToken } from '../api';

export const INITIAL_MOCK_USER: User = {
  id: 'usr-lucknow-101',
  fullName: 'Gaurav Mishra',
  phoneNumber: '+91 99190 77665',
  email: 'gaurav.mishra@example.com',
  city: 'Lucknow',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
  activeRole: 'CUSTOMER',
  isKycVerified: true,
  drivingLicenseNumber: 'UP32 20190014521',
  drivingLicenseVerified: true,
  referralCode: 'GAURAV200',
  createdAt: '2024-01-01T00:00:00Z',
};

export const mockAuthService = {
  async sendOtp(phoneNumber: string): Promise<ApiResponse<{ otpSent: boolean; message: string; otp?: string; sentViaSms?: boolean; provider?: string }>> {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    const fallbackOtp = Math.floor(1000 + Math.random() * 9000).toString();
    return mockApiCall({
      otpSent: true,
      message: `OTP sent successfully to +91 ${cleanPhone}`,
      otp: fallbackOtp,
      sentViaSms: false,
      provider: 'Simulator',
    });
  },

  async verifyOtp(phoneNumber: string, otp: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    const token = 'jwt_mock_token_' + Date.now();
    setAuthToken(token);
    return mockApiCall({
      user: { ...INITIAL_MOCK_USER, phoneNumber: `+91 ${cleanPhone}` },
      token,
    });
  },

  async signup(data: { fullName: string; phoneNumber: string; email: string; city: string; initialRole: UserRole }): Promise<ApiResponse<{ user: User; token: string }>> {
    const token = 'jwt_mock_token_' + Date.now();
    setAuthToken(token);
    const newUser: User = {
      id: 'usr-' + Date.now(),
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      email: data.email,
      city: data.city,
      activeRole: data.initialRole,
      isKycVerified: false,
      referralCode: data.fullName.split(' ')[0].toUpperCase() + '200',
      createdAt: new Date().toISOString(),
    };
    return mockApiCall({
      user: newUser,
      token,
    });
  },

  async switchRole(currentRole: UserRole): Promise<ApiResponse<{ activeRole: UserRole }>> {
    const newRole: UserRole = currentRole === 'CUSTOMER' ? 'HOST' : 'CUSTOMER';
    return mockApiCall({ activeRole: newRole }, 150);
  },

  async updateKyc(licenseNumber: string): Promise<ApiResponse<Partial<User>>> {
    return mockApiCall({
      drivingLicenseNumber: licenseNumber,
      drivingLicenseVerified: true,
      isKycVerified: true,
    }, 400);
  },
};

import { User, UserRole } from '../types';
import { mockApiCall, ApiResponse, setAuthToken } from './api';

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

export const authService = {
  async sendOtp(phoneNumber: string): Promise<ApiResponse<{ otpSent: boolean; message: string; otp?: string; sentViaSms?: boolean; provider?: string }>> {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    try {
      const res = await fetch('http://localhost:5000/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const json = await res.json();
      if (json.success) {
        return {
          data: {
            otpSent: true,
            message: json.message || `OTP sent to +91 ${cleanPhone}`,
            otp: json.otp,
            sentViaSms: json.sentViaSms,
            provider: json.provider,
          },
          success: true,
        };
      }
    } catch (err) {
      // Fallback if backend server unreachable
    }

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
    try {
      const res = await fetch('http://localhost:5000/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp }),
      });
      const json = await res.json();
      if (json.success) {
        const token = json.token || ('jwt_token_' + Date.now());
        setAuthToken(token);
        const user: User = {
          id: json.user?.id || ('usr-' + Date.now()),
          fullName: json.user?.name || 'MyRide User',
          phoneNumber: `+91 ${cleanPhone}`,
          email: json.user?.email || `user.${cleanPhone}@myride.in`,
          city: json.user?.city || 'Lucknow',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
          activeRole: (json.user?.role as UserRole) || 'CUSTOMER',
          isKycVerified: json.user?.kycStatus === 'VERIFIED',
          drivingLicenseNumber: 'UP32 20190014521',
          drivingLicenseVerified: true,
          referralCode: 'RIDE' + cleanPhone.slice(-4),
          createdAt: new Date().toISOString(),
        };
        return {
          data: { user, token },
          success: true,
        };
      } else if (json.message) {
        throw new Error(json.message);
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch')) {
        throw err;
      }
    }

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

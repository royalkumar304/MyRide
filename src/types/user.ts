export type UserRole = 'CUSTOMER' | 'HOST' | 'ADMIN';

export interface User {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  city: string;
  avatarUrl?: string;
  activeRole: UserRole;
  isKycVerified: boolean;
  drivingLicenseNumber?: string;
  drivingLicenseVerified?: boolean;
  referralCode: string;
  createdAt: string;
}

export interface HostProfile extends User {
  hostRating: number;
  totalHostTrips: number;
  responseRate: number; // e.g. 98%
  bankDetails?: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    upiId?: string;
  };
  isDocumentsVerified: boolean;
}

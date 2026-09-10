import { Vehicle, Booking } from '../types';

export type CustomerTabParamList = {
  HomeTab: undefined;
  ExploreTab: undefined;
  BookingsTab: undefined;
  SavedTab: undefined;
  ProfileTab: undefined;
};

export type HostTabParamList = {
  HostDashboardTab: undefined;
  HostVehiclesTab: undefined;
  HostBookingsTab: undefined;
  HostEarningsTab: undefined;
  HostProfileTab: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  OtpVerification: {
    phoneNumber: string;
    sentOtp?: string;
    isSignup?: boolean;
    signupData?: {
      fullName: string;
      phoneNumber: string;
      email: string;
      city: string;
      initialRole: 'CUSTOMER' | 'HOST';
    };
  };
  CustomerMain: undefined;
  HostMain: undefined;
  VehicleDetails: { vehicleId: string };
  BookingFlow: { vehicle: Vehicle };
  BookingConfirmation: { booking: Booking };
  BookingDetails: { bookingId: string };
  DigitalPickup: { bookingId: string };
  ReturnVehicle: { bookingId: string };
  Review: { bookingId: string; vehicleId: string; vehicleName: string };
  AddVehicleWizard: undefined;
  Chat: { threadId?: string; bookingId?: string; recipientName?: string };
  SafetyCenter: undefined;
  ReferEarn: undefined;
  Offers: undefined;
  SupportTicket: undefined;
};

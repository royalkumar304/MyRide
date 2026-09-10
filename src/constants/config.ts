export interface CategoryCommission {
  car: number;
  bike: number;
  suv: number;
  ev: number;
}

export const APP_CONFIG = {
  appName: 'MyRide',
  tagline: 'Apni Ride. Apna Choice.',
  altTagline: 'Ride Local. Ride Your Way.',
  supportPhone: '+91 8000 123 456',
  supportEmail: 'support@myride.in',
  emergencyPhone: '112',
  roadsideAssistancePhone: '+91 1800 555 789',

  // Configurable Platform Commission (Default 15%)
  defaultCommissionPercentage: 15,
  categoryCommissionPercentages: {
    car: 15,
    bike: 12, // Lower commission for bikes to encourage host supply
    suv: 15,
    ev: 10,   // Incentivized green mobility
  } as CategoryCommission,

  // Refundable Security Deposit Defaults
  defaultSecurityDeposit: {
    bike: 1000,
    car: 2000,
    suv: 3000,
    ev: 2500,
  },

  // Referral Reward in INR
  referralRewardAmount: 200,
  referredUserDiscount: 150,

  // Client-safe environment configuration
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:5000/api/v1',
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '',
  razorpayKeyId: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '',
  firebaseConfig: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'myride-mobility',
    messagingSenderId: '1092837465',
    appId: '1:1092837465:web:abcdef123456',
  },
  cloudinaryConfig: {
    cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || 'myride-assets',
    uploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_PRESET || process.env.CLOUDINARY_PRESET || 'vehicle_documents',
  },
};

export default APP_CONFIG;

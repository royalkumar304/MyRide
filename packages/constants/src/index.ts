// Shared Constants for MyRide Platform

export const COLORS = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',
  secondary: '#0EA5E9',
  accent: '#F97316',
  dark: '#111827',
  darkMuted: '#374151',
  body: '#4B5563',
  muted: '#9CA3AF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceVariant: '#F8FAFC',
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
};

export interface ICityInfo {
  id: string;
  name: string;
  state: string;
  isPopular: boolean;
  hubs: string[];
  coordinates: [number, number]; // [lng, lat]
}

export const TIER2_TIER3_CITIES: ICityInfo[] = [
  {
    id: 'lucknow',
    name: 'Lucknow',
    state: 'Uttar Pradesh',
    isPopular: true,
    hubs: ['Gomti Nagar', 'Hazratganj', 'Alambagh', 'Indira Nagar', 'Charbagh'],
    coordinates: [80.9462, 26.8467],
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    isPopular: true,
    hubs: ['Malviya Nagar', 'Vaishali Nagar', 'Mansarovar', 'C-Scheme'],
    coordinates: [75.7873, 26.9124],
  },
  {
    id: 'indore',
    name: 'Indore',
    state: 'Madhya Pradesh',
    isPopular: true,
    hubs: ['Vijay Nagar', 'Palasia', 'Bhawarkua', 'Rajwada'],
    coordinates: [75.8577, 22.7196],
  },
  {
    id: 'bhopal',
    name: 'Bhopal',
    state: 'Madhya Pradesh',
    isPopular: true,
    hubs: ['MP Nagar', 'Arera Colony', 'Hoshangabad Road'],
    coordinates: [77.4126, 23.2599],
  },
  {
    id: 'kanpur',
    name: 'Kanpur',
    state: 'Uttar Pradesh',
    isPopular: true,
    hubs: ['Kakadeo', 'Swaroop Nagar', 'Civil Lines'],
    coordinates: [80.3319, 26.4499],
  },
  {
    id: 'patna',
    name: 'Patna',
    state: 'Bihar',
    isPopular: true,
    hubs: ['Boring Road', 'Kankarbagh', 'Bailey Road'],
    coordinates: [85.1376, 25.5941],
  },
  {
    id: 'dehradun',
    name: 'Dehradun',
    state: 'Uttarakhand',
    isPopular: true,
    hubs: ['Rajpur Road', 'Jakhan', 'Clock Tower'],
    coordinates: [78.0322, 30.3165],
  },
  {
    id: 'varanasi',
    name: 'Varanasi',
    state: 'Uttar Pradesh',
    isPopular: true,
    hubs: ['Assi Ghat', 'Lanka', 'Sigra'],
    coordinates: [82.9739, 25.3176],
  },
  {
    id: 'agra',
    name: 'Agra',
    state: 'Uttar Pradesh',
    isPopular: true,
    hubs: ['Sanjay Place', 'Fatehabad Road', 'Tajganj'],
    coordinates: [78.0081, 27.1767],
  },
  {
    id: 'chandigarh',
    name: 'Chandigarh',
    state: 'Punjab / Haryana',
    isPopular: true,
    hubs: ['Sector 17', 'Sector 35', 'Sector 22'],
    coordinates: [76.7794, 30.7333],
  },
];

export const DEFAULT_PLATFORM_SETTINGS = {
  commission: {
    defaultPercentage: 15,
    bikePercentage: 12,
    scooterPercentage: 12,
    carPercentage: 15,
    suvPercentage: 15,
    evPercentage: 10,
  },
  referral: {
    referrerReward: 200,
    referredDiscount: 150,
  },
  taxes: {
    gstPercentage: 18,
  },
  delivery: {
    baseDeliveryFee: 150,
    perKmFee: 15,
  },
  support: {
    phone: '+91 8000 123 456',
    email: 'support@myride.in',
    emergencyPhone: '112',
    roadsidePhone: '+91 1800 555 789',
  },
  supportedCities: TIER2_TIER3_CITIES.map((c) => c.name),
  updatedAt: new Date().toISOString(),
};

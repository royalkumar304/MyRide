export type VehicleCategory = 'bike' | 'car' | 'suv' | 'ev';
export type FuelType = 'Petrol' | 'Diesel' | 'Electric' | 'CNG';
export type TransmissionType = 'Manual' | 'Automatic';
export type VehicleStatus = 'available' | 'booked' | 'unavailable' | 'pending_verification';

export interface VehicleDocument {
  id: string;
  type: 'RC' | 'Insurance' | 'PUC' | 'Permit';
  documentNumber: string;
  fileUrl: string;
  verified: boolean;
  expiryDate?: string;
}

export interface Vehicle {
  id: string;
  hostId: string;
  hostName: string;
  hostRating: number;
  hostTrips: number;
  hostPhone?: string;
  isHostVerified: boolean;
  
  category: VehicleCategory;
  name: string; // e.g. "Honda Activa 6G"
  brand: string; // e.g. "Honda"
  model: string; // e.g. "Activa 6G"
  variant?: string;
  year: number;
  registrationNumber: string;
  
  fuelType: FuelType;
  transmission: TransmissionType;
  seatingCapacity: number;
  rating: number;
  tripsCount: number;
  
  // Location
  city: string;
  area: string;
  distanceKm?: number;
  latitude: number;
  longitude: number;
  
  // Pricing & Deposits
  pricePerDay: number;
  pricePerHour?: number;
  securityDeposit: number;
  deliveryAvailable: boolean;
  deliveryFee?: number;
  instantBooking: boolean;
  
  // Details & Visuals
  images: string[];
  features: string[]; // e.g. ['AC', 'Bluetooth', 'Helmet Provided', 'Fast Charging']
  guidelines?: string[];
  status: VehicleStatus;
  
  // Documents
  documents?: VehicleDocument[];
  createdAt: string;
}

export interface VehicleFilterParams {
  category?: VehicleCategory | 'all';
  vehicleType?: string;
  searchQuery?: string;
  q?: string;
  city?: string;
  area?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  price?: number;
  fuelType?: FuelType | string;
  fuelTypes?: FuelType[];
  transmission?: TransmissionType | string;
  transmissions?: TransmissionType[];
  seats?: number;
  seatingCapacity?: number[];
  rating?: number;
  minRating?: number;
  distance?: number;
  availability?: boolean | string;
  deliveryOnly?: boolean;
  instantBookingOnly?: boolean;
  verifiedOnly?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'popular' | 'nearest' | 'popularity';
}


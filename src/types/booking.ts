import { Vehicle } from './vehicle';

export type BookingStatus = 'upcoming' | 'active' | 'completed' | 'cancelled' | 'pending';
export type PickupMethod = 'self_pickup' | 'home_delivery';

export interface InspectionData {
  odometerReading: number;
  odometerPhotoUrl?: string;
  fuelLevelPercentage: number;
  fuelPhotoUrl?: string;
  scratchesNotes?: string;
  checklist: {
    lightsWorking: boolean;
    tyresInspected: boolean;
    acHeaterWorking: boolean;
    accessoriesPresent: boolean;
    documentsPresent: boolean;
  };
  photos: string[];
  timestamp: string;
}

export interface BookingFare {
  baseRental: number;        // e.g. ₹1,499 * days
  durationDays: number;
  deliveryFee: number;       // e.g. ₹200 if home_delivery selected
  myRideServiceFee: number;  // 15% platform commission included or service fee
  discountAmount: number;    // Offer applied
  securityDeposit: number;   // Refundable deposit
  taxes: number;             // GST if applicable
  totalPayableNow: number;   // Total paid upfront
}

export interface Booking {
  id: string;                // e.g. "MYR-829431"
  vehicleId: string;
  vehicle: Vehicle;
  customerId: string;
  customerName: string;
  customerPhone: string;
  hostId: string;
  hostName: string;
  hostPhone: string;
  
  startDate: string;         // ISO date or formatted
  endDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupMethod: PickupMethod;
  
  status: BookingStatus;
  fare: BookingFare;
  paymentId?: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  
  // Digital Handover
  startInspection?: InspectionData;
  endInspection?: InspectionData;
  
  createdAt: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: 'customer' | 'host' | 'system';
  refundPercentage?: 100 | 0;
  refundAmount?: number;
  hostInformedCustomer?: boolean;
  modificationNote?: string;
  rated?: boolean;
}

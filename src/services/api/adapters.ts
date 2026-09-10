import {
  Vehicle,
  VehicleCategory,
  Booking,
  BookingStatus,
  BookingFare,
  PickupMethod,
  User,
  UserRole,
  HostEarningsSummary,
  HostEarningRecord,
} from '../../types';

export function adaptBackendVehicleToMobile(v: any): Vehicle {
  if (!v) return {} as Vehicle;

  // If already adapted and has no raw backend _id, return as is to avoid duplicate allocations
  if (v.id && v.category && v.pricePerDay !== undefined && !v._id && !v.pricing) {
    return v as Vehicle;
  }

  const typeMap: Record<string, VehicleCategory> = {
    BIKE: 'bike',
    SCOOTER: 'bike',
    CAR: 'car',
    SUV: 'suv',
    EV: 'ev',
    bike: 'bike',
    scooter: 'bike',
    car: 'car',
    suv: 'suv',
    ev: 'ev',
  };

  const category: VehicleCategory = typeMap[v.type] || typeMap[v.category] || 'car';
  const coords = v.location?.coordinates;
  const longitude = Array.isArray(coords) && coords.length >= 2 ? coords[0] : (v.longitude || 80.9462);
  const latitude = Array.isArray(coords) && coords.length >= 2 ? coords[1] : (v.latitude || 26.8467);

  const pricePerDay = v.pricing?.dailyRate ?? v.pricePerDay ?? 999;
  const pricePerHour = v.pricing?.hourlyRate ?? v.pricePerHour ?? Math.round(pricePerDay / 12);
  const securityDeposit = v.pricing?.securityDeposit ?? v.securityDeposit ?? 2000;
  const deliveryFee = v.pricing?.deliveryFee ?? v.deliveryFee ?? 150;

  const ownerId = typeof v.ownerId === 'object' && v.ownerId?._id ? v.ownerId._id.toString() : (v.ownerId || v.hostId || 'host-101');
  const ownerName = v.ownerName || (typeof v.ownerId === 'object' ? v.ownerId?.name : undefined) || v.hostName || 'Amitabh Verma';

  return {
    id: v._id ? v._id.toString() : (v.id || 'veh-' + Math.random().toString(36).substr(2, 9)),

    hostId: ownerId,
    hostName: ownerName,
    hostRating: v.ownerRating ?? v.hostRating ?? 4.9,
    hostTrips: v.totalTrips ?? v.hostTrips ?? 18,
    hostPhone: v.ownerPhone || v.hostPhone,
    isHostVerified: v.isHostVerified ?? true,

    category,
    name: v.name || `${v.brand || ''} ${v.model || ''}`.trim() || 'Vehicle',
    brand: v.brand || 'Generic',
    model: v.model || 'Model',
    variant: v.variant,
    year: v.year || 2023,
    registrationNumber: v.registrationNumber || 'UP32 MR 0001',

    fuelType: v.fuelType || 'Petrol',
    transmission: v.transmission || 'Manual',
    seatingCapacity: v.seats ?? v.seatingCapacity ?? (category === 'bike' ? 2 : 5),
    rating: v.rating || 4.9,
    tripsCount: v.totalTrips ?? v.tripsCount ?? 0,

    city: v.location?.city || v.city || 'Lucknow',
    area: v.location?.area || v.area || 'Hazratganj',
    distanceKm: v.distanceKm || 1.8,
    latitude,
    longitude,

    pricePerDay,
    pricePerHour,
    securityDeposit,
    deliveryAvailable: v.deliveryAvailable ?? true,
    deliveryFee,
    instantBooking: v.instantBooking ?? true,

    images: Array.isArray(v.images) && v.images.length > 0
      ? v.images
      : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800'],
    features: v.features || ['AC', 'GPS', 'Bluetooth', 'Airbags'],
    guidelines: v.guidelines || ['Valid Driving License required', 'Zero alcohol tolerance'],
    status: v.verificationStatus === 'APPROVED' ? 'available' : (v.status || 'available'),
    createdAt: v.createdAt ? new Date(v.createdAt).toISOString() : new Date().toISOString(),
  };
}

export function adaptBackendBookingStatus(status: string): BookingStatus {
  switch (status?.toUpperCase()) {
    case 'PAYMENT_PENDING':
      return 'pending';
    case 'CONFIRMED':
      return 'upcoming';
    case 'ACTIVE':
      return 'active';
    case 'COMPLETED':
      return 'completed';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return (status?.toLowerCase() as BookingStatus) || 'upcoming';
  }
}

export function adaptBackendBookingToMobile(b: any): Booking {
  const pricing = b.pricing || b.pricingBreakdown || {};
  const fare: BookingFare = {
    baseRental: pricing.baseAmount || pricing.rentalSubtotal || 1000,
    durationDays: b.durationDays || pricing.durationDays || 1,
    deliveryFee: pricing.deliveryFee || 0,
    myRideServiceFee: pricing.commissionAmount || pricing.serviceFee || 150,
    discountAmount: pricing.discount || 0,
    securityDeposit: pricing.securityDeposit || 2000,
    taxes: pricing.taxes || Math.round((pricing.commissionAmount || 150) * 0.18),
    totalPayableNow: pricing.totalAmount || pricing.totalPayable || 3300,
  };

  const vehicle = b.vehicle
    ? adaptBackendVehicleToMobile(b.vehicle)
    : (typeof b.vehicleId === 'object' && b.vehicleId ? adaptBackendVehicleToMobile(b.vehicleId) : undefined);

  const pickupMethod: PickupMethod = (b.pickupType as PickupMethod) || 'self_pickup';

  return {
    id: b.bookingId || (b._id ? b._id.toString() : (b.id || 'MYR-' + Date.now())),
    vehicleId: typeof b.vehicleId === 'object' && b.vehicleId?._id ? b.vehicleId._id.toString() : (b.vehicleId || ''),
    vehicle: vehicle as any,
    customerId: typeof b.customerId === 'object' && b.customerId?._id ? b.customerId._id.toString() : (b.customerId || ''),
    customerName: b.customerName || (typeof b.customerId === 'object' ? b.customerId?.name : 'Customer'),
    customerPhone: b.customerPhone || (typeof b.customerId === 'object' ? b.customerId?.phone : '+91 9876543210'),
    hostId: typeof b.hostId === 'object' && b.hostId?._id ? b.hostId._id.toString() : (b.hostId || ''),
    hostName: b.hostName || (typeof b.hostId === 'object' ? b.hostId?.name : 'Amitabh Verma'),
    hostPhone: b.hostPhone || (typeof b.hostId === 'object' ? b.hostId?.phone : '+91 9876500001'),

    startDate: b.startDateTime ? new Date(b.startDateTime).toISOString() : (b.startDate || new Date().toISOString()),
    endDate: b.endDateTime ? new Date(b.endDateTime).toISOString() : (b.endDate || new Date().toISOString()),
    pickupLocation: b.pickupLocation || b.pickupAddress || 'Hazratganj Hub, Lucknow',
    dropoffLocation: b.dropoffLocation || b.dropoffAddress || 'Hazratganj Hub, Lucknow',
    pickupMethod,

    fare,
    status: adaptBackendBookingStatus(b.bookingStatus || b.status),
    paymentStatus: b.paymentStatus === 'PAID' ? 'completed' : (b.paymentStatus || 'pending'),
    cancellationReason: b.cancellationReason,
    cancelledAt: b.cancelledAt,
    refundPercentage: b.refundPercentage,
    refundAmount: b.refundAmount,

    startInspection: b.startInspection,
    endInspection: b.endInspection,
    createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
  };
}

export function adaptBackendUserToMobile(u: any): User {
  const cleanPhone = (u.phone || '').replace(/\D/g, '').slice(-10);
  return {
    id: u.id || (u._id ? u._id.toString() : 'usr-' + Date.now()),
    fullName: u.name || u.fullName || 'MyRide User',
    phoneNumber: `+91 ${cleanPhone}`,
    email: u.email || `user.${cleanPhone}@myride.in`,
    city: u.city || 'Lucknow',
    avatarUrl: u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
    activeRole: (u.role as UserRole) || 'CUSTOMER',
    isKycVerified: u.kycStatus === 'VERIFIED' || u.isKycVerified || false,
    drivingLicenseNumber: u.drivingLicenseNumber || 'UP32 20190014521',
    drivingLicenseVerified: u.kycStatus === 'VERIFIED' || u.drivingLicenseVerified || false,
    referralCode: u.referralCode || `RIDE${cleanPhone.slice(-4)}`,
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
  };
}

export function adaptBackendHostDashboard(stats: any, earningsList: any[] = []): HostEarningsSummary {
  const recentTransactions: HostEarningRecord[] = earningsList.map((e, index) => ({
    id: e._id ? e._id.toString() : `tx-${index}`,
    bookingId: e.bookingId ? e.bookingId.toString() : `MYR-${1000 + index}`,
    vehicleName: e.vehicleName || 'Vehicle',
    tripDate: e.tripDate ? new Date(e.tripDate).toLocaleDateString('en-IN') : 'Recent',
    durationDays: 2,
    grossAmount: e.grossAmount || 2000,
    platformCommissionRate: e.commissionPercentage || 15,
    platformCommissionAmount: e.commissionAmount || 300,
    netHostEarnings: e.netAmount || 1700,
    status: (e.status === 'AVAILABLE' ? 'settled' : 'pending') as 'pending' | 'settled' | 'withdrawn',
  }));

  return {
    totalGrossEarnings: stats?.totalGrossEarnings ?? 42500,
    totalPlatformCommission: stats?.totalCommissionPaid ?? 6375,
    totalNetEarnings: stats?.netEarnings ?? 36125,
    availableBalance: stats?.netEarnings ?? 36125,
    pendingSettlement: 0,
    thisMonthEarnings: Math.round((stats?.netEarnings ?? 36125) * 0.4),
    activeRentalsCount: stats?.activeRentals ?? 1,
    completedTripsCount: stats?.completedBookings ?? 8,
    chartData: {
      period: 'monthly',
      labels: ['Jun', 'Jul', 'Aug', 'Sep'],
      values: [6800, 10200, 11900, 7225],
    },
    recentTransactions,
  };
}

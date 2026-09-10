/**
 * MongoDB / Mongoose Schema Definitions for MyRide Platform
 * Ready for Node.js + Express.js backend deployment
 */

export interface IMongooseSchemaDoc {
  type: string;
  required?: boolean;
  unique?: boolean;
  default?: any;
  ref?: string;
  enum?: string[];
  index?: boolean;
}

export const MongoSchemas = {
  // 1. User Schema (Customer, Host, Admin)
  User: {
    fullName: { type: 'String', required: true, trim: true },
    phoneNumber: { type: 'String', required: true, unique: true, index: true },
    email: { type: 'String', required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: 'String' }, // For email/password or admin
    role: { type: 'String', enum: ['CUSTOMER', 'HOST', 'ADMIN'], default: 'CUSTOMER' },
    city: { type: 'String', required: true, index: true },
    avatarUrl: { type: 'String' },
    isKycVerified: { type: 'Boolean', default: false },
    drivingLicenseNumber: { type: 'String', index: true },
    drivingLicenseExpiry: { type: 'Date' },
    drivingLicenseFrontUrl: { type: 'String' },
    drivingLicenseBackUrl: { type: 'String' },
    referralCode: { type: 'String', unique: true, index: true },
    referredBy: { type: 'ObjectId', ref: 'User' },
    walletBalance: { type: 'Number', default: 0 },
    createdAt: { type: 'Date', default: 'Date.now' },
    updatedAt: { type: 'Date', default: 'Date.now' },
  },

  // 2. Vehicle Schema
  Vehicle: {
    hostId: { type: 'ObjectId', ref: 'User', required: true, index: true },
    category: { type: 'String', enum: ['bike', 'car', 'suv', 'ev'], required: true, index: true },
    name: { type: 'String', required: true },
    brand: { type: 'String', required: true, index: true },
    model: { type: 'String', required: true },
    variant: { type: 'String' },
    year: { type: 'Number', required: true },
    registrationNumber: { type: 'String', required: true, unique: true, uppercase: true, index: true },
    fuelType: { type: 'String', enum: ['Petrol', 'Diesel', 'Electric', 'CNG'], required: true },
    transmission: { type: 'String', enum: ['Manual', 'Automatic'], required: true },
    seatingCapacity: { type: 'Number', required: true },
    city: { type: 'String', required: true, index: true },
    area: { type: 'String', required: true },
    location: {
      type: { type: 'String', default: 'Point' },
      coordinates: [Number], // [longitude, latitude] for geospatial indexing
    },
    pricePerDay: { type: 'Number', required: true },
    pricePerHour: { type: 'Number' },
    pricePerWeek: { type: 'Number' },
    securityDeposit: { type: 'Number', required: true },
    deliveryAvailable: { type: 'Boolean', default: false },
    deliveryFee: { type: 'Number', default: 0 },
    instantBooking: { type: 'Boolean', default: true },
    images: [{ type: 'String', required: true }],
    features: [{ type: 'String' }],
    guidelines: [{ type: 'String' }],
    status: {
      type: 'String',
      enum: ['available', 'booked', 'unavailable', 'pending_verification', 'rejected'],
      default: 'pending_verification',
      index: true,
    },
    rating: { type: 'Number', default: 5.0 },
    tripsCount: { type: 'Number', default: 0 },
    createdAt: { type: 'Date', default: 'Date.now' },
  },

  // 3. VehicleDocument Schema
  VehicleDocument: {
    vehicleId: { type: 'ObjectId', ref: 'Vehicle', required: true, index: true },
    type: { type: 'String', enum: ['RC', 'Insurance', 'PUC', 'Permit'], required: true },
    documentNumber: { type: 'String', required: true },
    fileUrl: { type: 'String', required: true },
    expiryDate: { type: 'Date' },
    verifiedByAdmin: { type: 'Boolean', default: false },
    verificationNotes: { type: 'String' },
    verifiedAt: { type: 'Date' },
  },

  // 4. Booking Schema
  Booking: {
    bookingId: { type: 'String', unique: true, required: true, index: true }, // e.g. "MYR-829431"
    customerId: { type: 'ObjectId', ref: 'User', required: true, index: true },
    hostId: { type: 'ObjectId', ref: 'User', required: true, index: true },
    vehicleId: { type: 'ObjectId', ref: 'Vehicle', required: true, index: true },
    startDate: { type: 'Date', required: true },
    endDate: { type: 'Date', required: true },
    durationDays: { type: 'Number', required: true },
    pickupLocation: { type: 'String', required: true },
    dropoffLocation: { type: 'String', required: true },
    pickupMethod: { type: 'String', enum: ['self_pickup', 'home_delivery'], default: 'self_pickup' },
    
    // Fare Breakdown
    fare: {
      baseRental: { type: 'Number', required: true },
      deliveryFee: { type: 'Number', default: 0 },
      myRideServiceFee: { type: 'Number', required: true }, // 15% Platform commission
      platformCommissionRate: { type: 'Number', default: 15 },
      securityDeposit: { type: 'Number', required: true },
      discountAmount: { type: 'Number', default: 0 },
      taxes: { type: 'Number', default: 0 },
      totalAmount: { type: 'Number', required: true },
    },
    
    status: {
      type: 'String',
      enum: ['pending', 'upcoming', 'active', 'completed', 'cancelled'],
      default: 'upcoming',
      index: true,
    },
    
    // Digital Handover
    startInspection: {
      odometerReading: { type: 'Number' },
      fuelLevelPercentage: { type: 'Number' },
      photos: [{ type: 'String' }],
      scratchesNotes: { type: 'String' },
      checklist: { type: 'Object' },
      confirmedAt: { type: 'Date' },
    },
    
    endInspection: {
      odometerReading: { type: 'Number' },
      fuelLevelPercentage: { type: 'Number' },
      photos: [{ type: 'String' }],
      damageReport: { type: 'String' },
      checklist: { type: 'Object' },
      confirmedAt: { type: 'Date' },
    },

    paymentStatus: { type: 'String', enum: ['pending', 'completed', 'refunded'], default: 'completed' },
    depositRefundStatus: { type: 'String', enum: ['held', 'initiated', 'refunded', 'deducted'], default: 'held' },
    createdAt: { type: 'Date', default: 'Date.now' },
  },

  // 5. Payment Transaction Schema (Razorpay Architecture)
  Payment: {
    bookingId: { type: 'ObjectId', ref: 'Booking', required: true, index: true },
    customerId: { type: 'ObjectId', ref: 'User', required: true },
    razorpayOrderId: { type: 'String', required: true, unique: true },
    razorpayPaymentId: { type: 'String', required: true, unique: true },
    razorpaySignature: { type: 'String', required: true },
    amountPaise: { type: 'Number', required: true },
    currency: { type: 'String', default: 'INR' },
    paymentMethod: { type: 'String', enum: ['upi', 'card', 'netbanking', 'wallet'] },
    status: { type: 'String', enum: ['captured', 'failed', 'refunded'], default: 'captured' },
    createdAt: { type: 'Date', default: 'Date.now' },
  },

  // 6. Host Earnings & Platform Commission Schema
  HostEarning: {
    hostId: { type: 'ObjectId', ref: 'User', required: true, index: true },
    bookingId: { type: 'ObjectId', ref: 'Booking', required: true },
    grossRentalAmount: { type: 'Number', required: true },
    commissionPercentage: { type: 'Number', default: 15 }, // Configurable per category
    platformCommissionAmount: { type: 'Number', required: true },
    netHostEarnings: { type: 'Number', required: true },
    payoutStatus: { type: 'String', enum: ['pending', 'available', 'processing', 'withdrawn'], default: 'available' },
    settledAt: { type: 'Date' },
  },

  // 7. Review Schema
  Review: {
    bookingId: { type: 'ObjectId', ref: 'Booking', required: true, unique: true },
    vehicleId: { type: 'ObjectId', ref: 'Vehicle', required: true, index: true },
    customerId: { type: 'ObjectId', ref: 'User', required: true },
    overallRating: { type: 'Number', required: true, min: 1, max: 5 },
    categoryRatings: {
      vehicleCondition: { type: 'Number', min: 1, max: 5 },
      hostBehaviour: { type: 'Number', min: 1, max: 5 },
      pickupExperience: { type: 'Number', min: 1, max: 5 },
      valueForMoney: { type: 'Number', min: 1, max: 5 },
    },
    comment: { type: 'String' },
    createdAt: { type: 'Date', default: 'Date.now' },
  },

  // 8. Platform Commission Configuration (Stored in DB, NOT hardcoded in backend)
  CommissionConfig: {
    defaultCommissionPercentage: { type: 'Number', default: 15 },
    carCommissionPercentage: { type: 'Number', default: 15 },
    bikeCommissionPercentage: { type: 'Number', default: 12 },
    suvCommissionPercentage: { type: 'Number', default: 15 },
    evCommissionPercentage: { type: 'Number', default: 10 },
    updatedByAdminId: { type: 'ObjectId', ref: 'User' },
    updatedAt: { type: 'Date', default: 'Date.now' },
  },
};

export default MongoSchemas;

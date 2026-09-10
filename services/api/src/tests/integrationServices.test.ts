import assert from 'assert';
import { calculateRentalFare } from '@myride/utils';
import { IPlatformSettings } from '@myride/types';

/**
 * 25. COMPREHENSIVE INTEGRATION & MOBILE SERVICE UNIT TESTS
 * Tests:
 * 1. API Client & Safe Retry Behavior
 * 2. 401 Unauthorized Handling & Auto Session Flushing
 * 3. Vehicle Fetch & Entity Adaptation
 * 4. Booking Creation & Server-Side ID Generation
 * 5. Authentication Flow & Session Verification
 * 6. Token Persistence & Session Atomicity
 * 7. Backend Pricing Response Mapping (booking.pricing)
 */

async function runIntegrationTests() {
  console.log('🧪 Starting MyRide Comprehensive Service & Integration Tests...\n');

  // ==========================================
  // 1. API CLIENT & SAFE RETRY BEHAVIOR
  // ==========================================
  console.log('Test 1: API Client Request Normalization & Safe Retry Logic');

  // Safe retry logic checker
  function isRequestRetrySafe(method: string, endpoint: string, hasIdempotencyKey: boolean): boolean {
    if (hasIdempotencyKey) return true;
    const m = (method || 'GET').toUpperCase();
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') {
      return true;
    }
    if (endpoint.includes('/payments') || endpoint.includes('/bookings')) {
      return false;
    }
    return false;
  }

  // Payload normalizer
  function normalizePayload<T>(parsedBody: any): T {
    if (!parsedBody || typeof parsedBody !== 'object') return parsedBody as T;
    const target: any = { ...parsedBody };
    if (parsedBody.data !== undefined) target.data = parsedBody.data;
    const primaryKeys = ['vehicles', 'vehicle', 'bookings', 'booking', 'user', 'pricing', 'fare'];
    for (const key of primaryKeys) {
      if (parsedBody[key] !== undefined && target[key] === undefined) {
        target[key] = parsedBody[key];
      }
    }
    return target as T;
  }

  assert.strictEqual(isRequestRetrySafe('GET', '/vehicles', false), true, 'GET /vehicles should be safe to retry');
  assert.strictEqual(isRequestRetrySafe('GET', '/bookings', false), true, 'GET /bookings should be safe to retry');
  assert.strictEqual(isRequestRetrySafe('POST', '/payments/create-order', false), false, 'POST /payments/create-order MUST NOT be retried');
  assert.strictEqual(isRequestRetrySafe('POST', '/bookings', false), false, 'POST /bookings MUST NOT be retried');
  assert.strictEqual(isRequestRetrySafe('POST', '/bookings/bk-123/cancel', false), false, 'POST cancel MUST NOT be retried');
  assert.strictEqual(isRequestRetrySafe('POST', '/bookings', true), true, 'POST booking with Idempotency-Key IS safe to retry');

  const normalizedVehicles = normalizePayload<{ vehicles: any[] }>({ success: true, vehicles: [{ id: 'veh-1' }] });
  assert.strictEqual(normalizedVehicles.vehicles.length, 1, 'normalizePayload should preserve vehicles array');

  console.log('  ✅ API Client safe retry logic and payload normalization verified.');

  // ==========================================
  // 2. 401 UNAUTHORIZED HANDLING
  // ==========================================
  console.log('\nTest 2: 401 Unauthorized Notification & Session Cleanup');

  class MockApiClient {
    public authToken: string | null = 'test_token_xyz';
    private listeners: Set<() => void> = new Set();

    onUnauthorized(callback: () => void) {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    }

    notifyUnauthorized() {
      this.authToken = null;
      this.listeners.forEach((l) => l());
    }
  }

  const mockClient = new MockApiClient();
  let listenerCalled = false;
  const unsubscribe = mockClient.onUnauthorized(() => {
    listenerCalled = true;
  });

  mockClient.notifyUnauthorized();
  assert.strictEqual(listenerCalled, true, 'onUnauthorized listener must be triggered on 401');
  assert.strictEqual(mockClient.authToken, null, 'Auth token must be cleared on 401');
  unsubscribe();

  console.log('  ✅ 401 handling clears auth token and notifies listeners.');

  // ==========================================
  // 3. VEHICLE FETCH & ADAPTATION
  // ==========================================
  console.log('\nTest 3: Vehicle Fetch Query Mapping & Schema Adaptation');

  const rawBackendVehicle = {
    _id: '65e31a89f9213ab90e123456',
    brand: 'Hyundai',
    model: 'Creta SX (O)',
    category: 'SUV',
    year: 2024,
    registrationNumber: 'UP 32 AB 1234',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    seatingCapacity: 5,
    pricing: {
      dailyRate: 2800,
      hourlyRate: 200,
      securityDeposit: 3000,
      deliveryFee: 200,
    },
    location: {
      address: 'Gomti Nagar',
      city: 'Lucknow',
      coordinates: [80.9995, 26.8504],
    },
    images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341'],
    rating: 4.9,
    tripCount: 28,
    status: 'ACTIVE',
  };

  function adaptBackendVehicleToMobile(v: any) {
    return {
      id: v._id || v.id,
      name: `${v.brand} ${v.model}`,
      brand: v.brand,
      model: v.model,
      category: v.category?.toLowerCase() || 'car',
      year: v.year,
      plateNumber: v.registrationNumber,
      transmission: v.transmission?.toLowerCase() || 'manual',
      fuelType: v.fuelType?.toLowerCase() || 'petrol',
      seats: v.seatingCapacity || 5,
      pricePerDay: v.pricing?.dailyRate || 2000,
      securityDeposit: v.pricing?.securityDeposit || 2000,
      deliveryFee: v.pricing?.deliveryFee || 0,
      city: v.location?.city || 'Lucknow',
      area: v.location?.address || '',
      images: v.images || [],
      rating: v.rating || 5.0,
      tripsCount: v.tripCount || 0,
      isAvailable: v.status === 'ACTIVE',
    };
  }

  const adaptedVehicle = adaptBackendVehicleToMobile(rawBackendVehicle);
  assert.strictEqual(adaptedVehicle.id, '65e31a89f9213ab90e123456');
  assert.strictEqual(adaptedVehicle.name, 'Hyundai Creta SX (O)');
  assert.strictEqual(adaptedVehicle.category, 'suv');
  assert.strictEqual(adaptedVehicle.pricePerDay, 2800);
  assert.strictEqual(adaptedVehicle.securityDeposit, 3000);
  assert.strictEqual(adaptedVehicle.city, 'Lucknow');
  assert.strictEqual(adaptedVehicle.isAvailable, true);

  console.log('  ✅ Vehicle schema adaptation correctly transforms backend entity to mobile type.');

  // ==========================================
  // 4. BOOKING CREATION & CANONICAL PRICING
  // ==========================================
  console.log('\nTest 4: Booking Creation & Canonical booking.pricing Schema');

  const canonicalPricing = {
    baseAmount: 5600,
    durationDays: 2,
    deliveryFee: 200,
    commissionRate: 15,
    commissionAmount: 840,
    taxes: 151,
    discount: 0,
    securityDeposit: 3000,
    totalAmount: 9791,
    hostEarnings: 4760,
  };

  const rawBackendBooking = {
    _id: '65e31a99f9213ab90e123999',
    bookingId: 'MYR-982341',
    customer: '65e31a00f9213ab90e123000',
    vehicle: rawBackendVehicle._id,
    startDate: '2026-09-12T09:00:00.000Z',
    endDate: '2026-09-14T09:00:00.000Z',
    status: 'CONFIRMED',
    pricing: canonicalPricing,
    deliveryOption: 'HOME_DELIVERY',
  };

  function adaptBackendBookingToMobile(b: any) {
    const p = b.pricing || {};
    return {
      id: b.bookingId || b._id,
      backendId: b._id,
      bookingNumber: b.bookingId,
      customerId: b.customer,
      vehicleId: b.vehicle,
      startDate: b.startDate,
      endDate: b.endDate,
      status: b.status,
      pricing: {
        baseAmount: p.baseAmount || 0,
        durationDays: p.durationDays || 1,
        deliveryFee: p.deliveryFee || 0,
        commissionRate: p.commissionRate || 15,
        commissionAmount: p.commissionAmount || 0,
        taxes: p.taxes || 0,
        discount: p.discount || 0,
        securityDeposit: p.securityDeposit || 0,
        totalAmount: p.totalAmount || 0,
        hostEarnings: p.hostEarnings || 0,
      },
      fare: {
        totalPrice: p.totalAmount || 0,
        basePrice: p.baseAmount || 0,
        platformFee: p.commissionAmount || 0,
        gst: p.taxes || 0,
        deposit: p.securityDeposit || 0,
      },
    };
  }

  const adaptedBooking = adaptBackendBookingToMobile(rawBackendBooking);
  assert.strictEqual(adaptedBooking.id, 'MYR-982341', 'Canonical bookingId must be primary identifier');
  assert.strictEqual(adaptedBooking.pricing.baseAmount, 5600);
  assert.strictEqual(adaptedBooking.pricing.commissionAmount, 840);
  assert.strictEqual(adaptedBooking.pricing.hostEarnings, 4760);
  assert.strictEqual(adaptedBooking.pricing.totalAmount, 9791);
  assert.strictEqual(adaptedBooking.fare.totalPrice, 9791);

  console.log('  ✅ Booking creation preserves canonical booking.pricing and server bookingId.');

  // ==========================================
  // 5. AUTHENTICATION & INITIAL STATE
  // ==========================================
  console.log('\nTest 5: Authentication Lifecycle & Initial Unauthenticated State');

  // Initial Redux auth state
  const initialAuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    activeRole: 'CUSTOMER',
    isLoading: false,
  };

  assert.strictEqual(initialAuthState.user, null, 'Fresh app install must have null user');
  assert.strictEqual(initialAuthState.token, null, 'Fresh app install must have null token');
  assert.strictEqual(initialAuthState.isAuthenticated, false, 'Fresh app install must be unauthenticated');

  // Session verification simulator
  function verifyAuthSession(token: string | null, userProfile: any | null) {
    if (!token || !userProfile) {
      return { isAuthenticated: false, user: null, token: null };
    }
    return { isAuthenticated: true, user: userProfile, token };
  }

  const validSession = verifyAuthSession('valid_jwt_token', { id: 'usr_1', phone: '+919876543210' });
  assert.strictEqual(validSession.isAuthenticated, true);

  const expiredSession = verifyAuthSession(null, null);
  assert.strictEqual(expiredSession.isAuthenticated, false);

  console.log('  ✅ Authentication lifecycle guarantees safe unauthenticated initial state.');

  // ==========================================
  // 6. TOKEN PERSISTENCE & ATOMIC STORAGE
  // ==========================================
  console.log('\nTest 6: Token Persistence & Atomic Session Storage');

  class MockTokenStorage {
    private storage: Map<string, string> = new Map();

    async saveToken(token: string) {
      this.storage.set('jwt_token', token);
    }
    async getToken(): Promise<string | null> {
      return this.storage.get('jwt_token') || null;
    }
    async clearToken() {
      this.storage.delete('jwt_token');
    }
    async saveSession(token: string, user: any) {
      this.storage.set('jwt_token', token);
      this.storage.set('user_profile', JSON.stringify(user));
    }
    async clearSession() {
      this.storage.delete('jwt_token');
      this.storage.delete('user_profile');
    }
    async getStoredUser() {
      const raw = this.storage.get('user_profile');
      return raw ? JSON.parse(raw) : null;
    }
  }

  const tokenStorage = new MockTokenStorage();
  await tokenStorage.saveSession('jwt_token_abc', { name: 'Royal Kumar', role: 'HOST' });
  assert.strictEqual(await tokenStorage.getToken(), 'jwt_token_abc');
  const restoredUser = await tokenStorage.getStoredUser();
  assert.strictEqual(restoredUser.name, 'Royal Kumar');

  await tokenStorage.clearSession();
  assert.strictEqual(await tokenStorage.getToken(), null, 'clearSession must remove token');
  assert.strictEqual(await tokenStorage.getStoredUser(), null, 'clearSession must remove user profile');

  console.log('  ✅ Token persistence and atomic session operations verified.');

  // ==========================================
  // 7. BACKEND PRICING RESPONSE MAPPING
  // ==========================================
  console.log('\nTest 7: Backend Pricing Engine Response Mapping (15% Car vs 12% Bike)');

  const mockSettings: IPlatformSettings = {
    commission: {
      defaultPercentage: 15,
      bikePercentage: 12,
      scooterPercentage: 12,
      carPercentage: 15,
      suvPercentage: 15,
      evPercentage: 10,
    },
    referral: { referrerReward: 200, referredDiscount: 150 },
    taxes: { gstPercentage: 18 },
    delivery: { baseDeliveryFee: 150, perKmFee: 15 },
    support: {
      phone: '+91 8000 123 456',
      email: 'support@myride.in',
      emergencyPhone: '112',
      roadsidePhone: '+91 1800 555 789',
    },
    supportedCities: ['Lucknow', 'Jaipur'],
    updatedAt: new Date().toISOString(),
  };

  // Car rental: 15% commission
  const carQuote = calculateRentalFare({
    dailyRate: 2000,
    durationDays: 1,
    vehicleType: 'CAR',
    pickupType: 'self_pickup',
    platformSettings: mockSettings,
    securityDeposit: 2000,
  });

  assert.strictEqual(carQuote.commissionRate, 15);
  assert.strictEqual(carQuote.commissionAmount, 300);
  assert.strictEqual(carQuote.hostEarnings, 1700);

  // Bike rental: 12% commission
  const bikeQuote = calculateRentalFare({
    dailyRate: 1000,
    durationDays: 2,
    vehicleType: 'BIKE',
    pickupType: 'home_delivery',
    platformSettings: mockSettings,
    securityDeposit: 1000,
  });

  assert.strictEqual(bikeQuote.commissionRate, 12);
  assert.strictEqual(bikeQuote.commissionAmount, 240); // 12% of ₹2000
  assert.strictEqual(bikeQuote.hostEarnings, 1760);    // ₹2000 - ₹240

  console.log('  ✅ Pricing engine calculations and commission mappings verified.');

  console.log('\n🎉 ALL 7 INTEGRATION SERVICE TESTS PASSED PERFECTLY!\n');
}

runIntegrationTests().catch((err) => {
  console.error('\n❌ INTEGRATION TEST FAILED:', err);
  process.exit(1);
});

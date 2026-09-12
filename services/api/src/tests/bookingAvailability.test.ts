import assert from 'assert';
import { ENV } from '../config/env';
import { connectDB } from '../config/db';
import { memoryStore } from '../config/store';
import BookingModel from '../models/Booking';
import VehicleModel from '../models/Vehicle';
import { createBooking, cancelBooking } from '../controllers/bookingController';
import { checkAvailability } from '../controllers/vehicleController';
import { createPaymentOrder } from '../controllers/paymentController';
import { checkVehicleAvailability } from '../services/availabilityService';

function createMockResponse() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    },
  };
  return res;
}

const noopNext = (err?: any) => {
  if (err) throw err;
};

async function runBookingAvailabilityTests() {
  console.log('🧪 Starting MyRide Phase 3A Core Booking Availability & Concurrency Test Suite...\n');

  ENV.USE_MEMORY_STORE = true;
  ENV.BOOKING_PAYMENT_HOLD_MINUTES = 15;
  await connectDB();

  // Reset memory store
  memoryStore.vehicles = [];
  memoryStore.bookings = [];

  const testVehicle: any = {
    _id: 'veh_test_phase3a_001',
    id: 'veh_test_phase3a_001',
    ownerId: 'user_host_1',
    ownerName: 'Amitabh Verma',
    ownerPhone: '9876500001',
    brand: 'Hyundai',
    model: 'Creta',
    type: 'CAR',
    pricing: {
      dailyRate: 2500,
      securityDeposit: 2000,
      deliveryFee: 150,
    },
    location: {
      address: 'Hazratganj Hub, Lucknow',
      area: 'Hazratganj',
      city: 'Lucknow',
      state: 'UP',
      coordinates: [80.9462, 26.8467],
    },
    verificationStatus: 'APPROVED',
    availability: { isAvailable: true },
    activeReservations: [],
  };

  memoryStore.vehicles.push(testVehicle);

  const customer1 = { userId: 'cust_user_001', name: 'Rahul Sharma', phone: '9876543210' };
  const customer2 = { userId: 'cust_user_002', name: 'Priya Singh', phone: '9876543211' };

  // =========================================================================
  // TEST 1: Concurrency - Overlapping Booking Requests Race Condition
  // =========================================================================
  console.log('Test 1: Concurrency - Overlapping Booking Requests Race Condition');
  {
    // Request A: 10:00 -> 12:00
    // Request B: 11:00 -> 13:00
    const startA = new Date('2026-10-01T10:00:00.000Z');
    const endA = new Date('2026-10-01T12:00:00.000Z');
    const startB = new Date('2026-10-01T11:00:00.000Z');
    const endB = new Date('2026-10-01T13:00:00.000Z');

    const reqA = {
      user: customer1,
      headers: {},
      body: {
        vehicleId: testVehicle._id,
        startDateTime: startA.toISOString(),
        endDateTime: endA.toISOString(),
        durationDays: 1,
        pickupType: 'self_pickup',
        pickupLocation: 'Hazratganj Hub',
        dropoffLocation: 'Hazratganj Hub',
      },
    };
    const resA = createMockResponse();

    const reqB = {
      user: customer2,
      headers: {},
      body: {
        vehicleId: testVehicle._id,
        startDateTime: startB.toISOString(),
        endDateTime: endB.toISOString(),
        durationDays: 1,
        pickupType: 'self_pickup',
        pickupLocation: 'Hazratganj Hub',
        dropoffLocation: 'Hazratganj Hub',
      },
    };
    const resB = createMockResponse();

    // Fire both requests concurrently
    await Promise.all([
      createBooking(reqA, resA, noopNext),
      createBooking(reqB, resB, noopNext),
    ]);

    const statusCodes = [resA.statusCode, resB.statusCode].sort();
    assert.deepStrictEqual(statusCodes, [201, 409], 'Exactly ONE request must succeed (201) and ONE must be rejected (409)');

    const conflictRes = resA.statusCode === 409 ? resA : resB;
    assert.strictEqual(conflictRes.body.success, false);
    assert.ok(
      conflictRes.body.message.includes('Vehicle is no longer available'),
      'Conflict response must indicate vehicle unavailability'
    );

    console.log('  ✅ Test 1 Passed: Exactly one overlapping request succeeded; other received HTTP 409 Conflict.');
  }

  // =========================================================================
  // TEST 2: Concurrency - Identical Dates Race Condition
  // =========================================================================
  console.log('Test 2: Concurrency - Identical Dates Race Condition');
  {
    // Clear bookings for next isolated test
    memoryStore.bookings = [];

    const start = new Date('2026-10-02T14:00:00.000Z');
    const end = new Date('2026-10-02T18:00:00.000Z');

    const req1 = {
      user: customer1,
      headers: {},
      body: {
        vehicleId: testVehicle._id,
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        durationDays: 1,
        pickupType: 'self_pickup',
        pickupLocation: 'Hazratganj Hub',
        dropoffLocation: 'Hazratganj Hub',
      },
    };
    const res1 = createMockResponse();

    const req2 = {
      user: customer2,
      headers: {},
      body: {
        vehicleId: testVehicle._id,
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        durationDays: 1,
        pickupType: 'self_pickup',
        pickupLocation: 'Hazratganj Hub',
        dropoffLocation: 'Hazratganj Hub',
      },
    };
    const res2 = createMockResponse();

    await Promise.all([
      createBooking(req1, res1, noopNext),
      createBooking(req2, res2, noopNext),
    ]);

    const statusCodes = [res1.statusCode, res2.statusCode].sort();
    assert.deepStrictEqual(statusCodes, [201, 409], 'Exactly ONE request must succeed and ONE must receive 409');
    assert.strictEqual(memoryStore.bookings.length, 1, 'Only one booking record must exist in the database');

    console.log('  ✅ Test 2 Passed: Simultaneous identical requests safely resolved with single booking.');
  }

  // =========================================================================
  // TEST 3: Idempotency - Same User + Same Idempotency Key Sequentially
  // =========================================================================
  console.log('Test 3: Idempotency - Same User + Same Idempotency Key Sequentially');
  {
    memoryStore.bookings = [];
    const testKey = 'idem_key_unique_seq_001';

    const reqFirst = {
      user: customer1,
      headers: { 'idempotency-key': testKey },
      body: {
        vehicleId: testVehicle._id,
        startDateTime: '2026-10-05T10:00:00.000Z',
        endDateTime: '2026-10-05T18:00:00.000Z',
        durationDays: 1,
        pickupType: 'self_pickup',
        pickupLocation: 'Hazratganj Hub',
        dropoffLocation: 'Hazratganj Hub',
      },
    };
    const resFirst = createMockResponse();
    await createBooking(reqFirst, resFirst, noopNext);

    assert.strictEqual(resFirst.statusCode, 201);
    const createdBookingId = resFirst.body.booking.bookingId;

    // Retry with same key
    const reqSecond = {
      user: customer1,
      headers: { 'idempotency-key': testKey },
      body: {
        vehicleId: testVehicle._id,
        startDateTime: '2026-10-05T10:00:00.000Z',
        endDateTime: '2026-10-05T18:00:00.000Z',
        durationDays: 1,
        pickupType: 'self_pickup',
        pickupLocation: 'Hazratganj Hub',
        dropoffLocation: 'Hazratganj Hub',
      },
    };
    const resSecond = createMockResponse();
    await createBooking(reqSecond, resSecond, noopNext);

    assert.strictEqual(resSecond.statusCode, 200, 'Idempotent replay must return HTTP 200');
    assert.strictEqual(resSecond.body.idempotent, true);
    assert.strictEqual(resSecond.body.booking.bookingId, createdBookingId);
    assert.strictEqual(memoryStore.bookings.length, 1, 'No duplicate booking created');

    console.log('  ✅ Test 3 Passed: Sequential idempotent submission returned existing booking without duplicating.');
  }

  // =========================================================================
  // TEST 4: Idempotency - Same User + Same Idempotency Key Concurrently
  // =========================================================================
  console.log('Test 4: Idempotency - Same User + Same Idempotency Key Concurrently');
  {
    memoryStore.bookings = [];
    const testKey = 'idem_key_concurrent_002';

    const reqA = {
      user: customer1,
      headers: { 'idempotency-key': testKey },
      body: {
        vehicleId: testVehicle._id,
        startDateTime: '2026-10-06T10:00:00.000Z',
        endDateTime: '2026-10-06T18:00:00.000Z',
        durationDays: 1,
        pickupType: 'self_pickup',
        pickupLocation: 'Hazratganj Hub',
        dropoffLocation: 'Hazratganj Hub',
      },
    };
    const resA = createMockResponse();

    const reqB = {
      user: customer1,
      headers: { 'idempotency-key': testKey },
      body: {
        vehicleId: testVehicle._id,
        startDateTime: '2026-10-06T10:00:00.000Z',
        endDateTime: '2026-10-06T18:00:00.000Z',
        durationDays: 1,
        pickupType: 'self_pickup',
        pickupLocation: 'Hazratganj Hub',
        dropoffLocation: 'Hazratganj Hub',
      },
    };
    const resB = createMockResponse();

    await Promise.all([
      createBooking(reqA, resA, noopNext),
      createBooking(reqB, resB, noopNext),
    ]);

    assert.strictEqual(memoryStore.bookings.length, 1, 'Only 1 booking must be created for concurrent duplicate submission');
    const bIdA = resA.body.booking.bookingId;
    const bIdB = resB.body.booking.bookingId;
    assert.strictEqual(bIdA, bIdB, 'Both responses must return the same bookingId');

    console.log('  ✅ Test 4 Passed: Concurrent duplicate submissions safely yielded single booking.');
  }

  // =========================================================================
  // TEST 5: Idempotency - Same User + Different Keys for Overlapping Dates
  // =========================================================================
  console.log('Test 5: Idempotency - Same User + Different Keys for Overlapping Dates');
  {
    const reqFirst = {
      user: customer1,
      headers: { 'idempotency-key': 'key_alpha_1' },
      body: {
        vehicleId: testVehicle._id,
        startDateTime: '2026-10-07T10:00:00.000Z',
        endDateTime: '2026-10-07T14:00:00.000Z',
        durationDays: 1,
        pickupType: 'self_pickup',
        pickupLocation: 'Hazratganj Hub',
        dropoffLocation: 'Hazratganj Hub',
      },
    };
    const resFirst = createMockResponse();
    await createBooking(reqFirst, resFirst, noopNext);
    assert.strictEqual(resFirst.statusCode, 201);

    // Second request with different idempotency key for overlapping period
    const reqSecond = {
      user: customer1,
      headers: { 'idempotency-key': 'key_beta_2' },
      body: {
        vehicleId: testVehicle._id,
        startDateTime: '2026-10-07T12:00:00.000Z',
        endDateTime: '2026-10-07T16:00:00.000Z',
        durationDays: 1,
        pickupType: 'self_pickup',
        pickupLocation: 'Hazratganj Hub',
        dropoffLocation: 'Hazratganj Hub',
      },
    };
    const resSecond = createMockResponse();
    await createBooking(reqSecond, resSecond, noopNext);
    assert.strictEqual(resSecond.statusCode, 409, 'Different key for overlapping date must be rejected with 409');

    console.log('  ✅ Test 5 Passed: Different keys for overlapping dates properly enforced availability conflict.');
  }

  // =========================================================================
  // TEST 6: Payment Hold - PAYMENT_PENDING blocks overlapping booking
  // =========================================================================
  console.log('Test 6: Payment Hold - PAYMENT_PENDING blocks overlapping booking');
  {
    memoryStore.bookings = [];
    // Create an unexpired PAYMENT_PENDING booking
    const holdExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins in future
    memoryStore.bookings.push({
      _id: 'book_hold_1',
      bookingId: 'MYR-HOLD-001',
      customerId: customer1.userId,
      customerName: customer1.name,
      customerPhone: customer1.phone,
      hostId: testVehicle.ownerId,
      hostName: testVehicle.ownerName,
      hostPhone: testVehicle.ownerPhone,
      vehicleId: testVehicle._id,
      startDateTime: '2026-10-10T10:00:00.000Z',
      endDateTime: '2026-10-10T15:00:00.000Z',
      bookingStatus: 'PAYMENT_PENDING' as const,
      paymentStatus: 'pending' as const,
      reservationExpiresAt: holdExpiry.toISOString(),
    } as any);

    const avail = await checkVehicleAvailability({
      vehicleId: testVehicle._id,
      startDateTime: '2026-10-10T12:00:00.000Z',
      endDateTime: '2026-10-10T14:00:00.000Z',
    });
    assert.strictEqual(avail.isAvailable, false, 'Unexpired PAYMENT_PENDING must block availability');

    console.log('  ✅ Test 6 Passed: Unexpired PAYMENT_PENDING booking successfully blocks overlapping slot.');
  }

  // =========================================================================
  // TEST 7: Payment Hold - Non-overlapping slot is NOT blocked
  // =========================================================================
  console.log('Test 7: Payment Hold - Non-overlapping slot is NOT blocked');
  {
    const avail = await checkVehicleAvailability({
      vehicleId: testVehicle._id,
      startDateTime: '2026-10-10T16:00:00.000Z',
      endDateTime: '2026-10-10T20:00:00.000Z',
    });
    assert.strictEqual(avail.isAvailable, true, 'Non-overlapping slot must be available');

    console.log('  ✅ Test 7 Passed: Non-overlapping slot is correctly available.');
  }

  // =========================================================================
  // TEST 8: Reservation Expiration - Expired PAYMENT_PENDING releases vehicle
  // =========================================================================
  console.log('Test 8: Reservation Expiration - Expired PAYMENT_PENDING releases vehicle');
  {
    memoryStore.bookings = [];
    // Booking with hold expired 5 minutes ago
    const pastExpiry = new Date(Date.now() - 5 * 60 * 1000);
    memoryStore.bookings.push({
      _id: 'book_hold_expired',
      bookingId: 'MYR-EXPIRED-001',
      customerId: customer1.userId,
      customerName: customer1.name,
      customerPhone: customer1.phone,
      hostId: testVehicle.ownerId,
      hostName: testVehicle.ownerName,
      hostPhone: testVehicle.ownerPhone,
      vehicleId: testVehicle._id,
      startDateTime: '2026-10-11T10:00:00.000Z',
      endDateTime: '2026-10-11T15:00:00.000Z',
      bookingStatus: 'PAYMENT_PENDING' as const,
      paymentStatus: 'pending' as const,
      reservationExpiresAt: pastExpiry.toISOString(),
    } as any);

    const avail = await checkVehicleAvailability({
      vehicleId: testVehicle._id,
      startDateTime: '2026-10-11T12:00:00.000Z',
      endDateTime: '2026-10-11T14:00:00.000Z',
    });
    assert.strictEqual(avail.isAvailable, true, 'Expired PAYMENT_PENDING must no longer block availability');

    // Attempting to book the released slot now succeeds
    const req = {
      user: customer2,
      headers: {},
      body: {
        vehicleId: testVehicle._id,
        startDateTime: '2026-10-11T12:00:00.000Z',
        endDateTime: '2026-10-11T14:00:00.000Z',
        durationDays: 1,
        pickupType: 'self_pickup',
        pickupLocation: 'Hazratganj Hub',
        dropoffLocation: 'Hazratganj Hub',
      },
    };
    const res = createMockResponse();
    await createBooking(req, res, noopNext);
    assert.strictEqual(res.statusCode, 201, 'New booking request succeeds over expired reservation');

    console.log('  ✅ Test 8 Passed: Expired PAYMENT_PENDING reservation released slot for new booking.');
  }

  // =========================================================================
  // TEST 9: Payment Lifecycle - Expired Booking Cannot Create Payment Order
  // =========================================================================
  console.log('Test 9: Payment Lifecycle - Expired Booking Cannot Create Payment Order');
  {
    const expiredBooking = memoryStore.bookings.find((b) => b.bookingId === 'MYR-EXPIRED-001');
    assert.ok(expiredBooking, 'Expired booking must exist');

    const req = {
      user: customer1,
      body: { bookingId: expiredBooking.bookingId },
    };
    const res = createMockResponse();
    await createPaymentOrder(req, res, noopNext);

    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.body.message.includes('expired'), 'Error message must specify booking reservation has expired');

    console.log('  ✅ Test 9 Passed: Payment order creation strictly rejected for expired booking.');
  }

  // =========================================================================
  // TEST 10: CONFIRMED Booking Blocks Overlap
  // =========================================================================
  console.log('Test 10: CONFIRMED Booking Blocks Overlap');
  {
    memoryStore.bookings = [];
    memoryStore.bookings.push({
      _id: 'book_confirmed_1',
      bookingId: 'MYR-CONFIRMED-001',
      customerId: customer1.userId,
      customerName: customer1.name,
      customerPhone: customer1.phone,
      hostId: testVehicle.ownerId,
      hostName: testVehicle.ownerName,
      hostPhone: testVehicle.ownerPhone,
      vehicleId: testVehicle._id,
      startDateTime: '2026-10-12T10:00:00.000Z',
      endDateTime: '2026-10-12T16:00:00.000Z',
      bookingStatus: 'CONFIRMED' as const,
      paymentStatus: 'paid' as const,
    } as any);

    const avail = await checkVehicleAvailability({
      vehicleId: testVehicle._id,
      startDateTime: '2026-10-12T11:00:00.000Z',
      endDateTime: '2026-10-12T13:00:00.000Z',
    });
    assert.strictEqual(avail.isAvailable, false, 'CONFIRMED booking must block overlapping dates');

    console.log('  ✅ Test 10 Passed: CONFIRMED booking actively blocks availability.');
  }

  // =========================================================================
  // TEST 11: CANCELLED Booking Releases Availability
  // =========================================================================
  console.log('Test 11: CANCELLED Booking Releases Availability');
  {
    const b = memoryStore.bookings.find((b) => b.bookingId === 'MYR-CONFIRMED-001');
    assert.ok(b);

    // Cancel the booking
    const cancelReq = {
      params: { id: b.bookingId },
      user: customer1,
      body: { reason: 'Change of plans' },
    };
    const cancelRes = createMockResponse();
    await cancelBooking(cancelReq, cancelRes, noopNext);
    assert.strictEqual(cancelRes.statusCode, 200);
    assert.strictEqual(b.bookingStatus, 'CANCELLED');

    // Slot should now be available
    const avail = await checkVehicleAvailability({
      vehicleId: testVehicle._id,
      startDateTime: '2026-10-12T11:00:00.000Z',
      endDateTime: '2026-10-12T13:00:00.000Z',
    });
    assert.strictEqual(avail.isAvailable, true, 'CANCELLED booking must release availability immediately');

    console.log('  ✅ Test 11 Passed: Cancellation releases vehicle availability immediately.');
  }

  // =========================================================================
  // TEST 12: Cancellation Security - Unauthorized Non-Owner Rejected
  // =========================================================================
  console.log('Test 12: Cancellation Security - Unauthorized Non-Owner Rejected');
  {
    // Create new booking owned by Customer 1
    const newBooking: any = {
      _id: 'book_owned_by_cust1',
      bookingId: 'MYR-OWNER-001',
      customerId: customer1.userId,
      hostId: testVehicle.ownerId,
      vehicleId: testVehicle._id,
      bookingStatus: 'UPCOMING',
      paymentStatus: 'paid',
    };
    memoryStore.bookings.push(newBooking);

    // Customer 2 attempts to cancel Customer 1's booking
    const unauthorizedReq = {
      params: { id: newBooking.bookingId },
      user: customer2,
      body: { reason: 'Malicious cancellation attempt' },
    };
    const unauthorizedRes = createMockResponse();
    await cancelBooking(unauthorizedReq, unauthorizedRes, noopNext);

    assert.strictEqual(unauthorizedRes.statusCode, 403, 'Non-owner must receive HTTP 403 Forbidden');
    assert.strictEqual(newBooking.bookingStatus, 'UPCOMING', 'Booking status must not be modified');

    console.log('  ✅ Test 12 Passed: Non-owner cancellation attempt blocked with HTTP 403.');
  }

  // =========================================================================
  // TEST 13: Cancellation State Machine - Cannot Cancel COMPLETED Booking
  // =========================================================================
  console.log('Test 13: Cancellation State Machine - Cannot Cancel COMPLETED Booking');
  {
    const completedBooking: any = {
      _id: 'book_completed_001',
      bookingId: 'MYR-COMPLETED-001',
      customerId: customer1.userId,
      hostId: testVehicle.ownerId,
      vehicleId: testVehicle._id,
      bookingStatus: 'COMPLETED',
      paymentStatus: 'completed',
    };
    memoryStore.bookings.push(completedBooking);

    const req = {
      params: { id: completedBooking.bookingId },
      user: customer1,
      body: { reason: 'Trying to cancel finished trip' },
    };
    const res = createMockResponse();
    await cancelBooking(req, res, noopNext);

    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.body.message.includes('completed'), 'Error message must specify cannot cancel completed booking');

    console.log('  ✅ Test 13 Passed: Cannot cancel an already COMPLETED booking.');
  }

  // =========================================================================
  // TEST 14: Boundary Conditions - Adjacent Bookings Allowed
  // =========================================================================
  console.log('Test 14: Boundary Conditions - Adjacent Bookings Allowed');
  {
    memoryStore.bookings = [];
    // Booking A: 10:00 -> 12:00
    memoryStore.bookings.push({
      _id: 'book_adj_A',
      bookingId: 'MYR-ADJ-A',
      customerId: customer1.userId,
      customerName: customer1.name,
      customerPhone: customer1.phone,
      hostId: testVehicle.ownerId,
      hostName: testVehicle.ownerName,
      hostPhone: testVehicle.ownerPhone,
      vehicleId: testVehicle._id,
      startDateTime: '2026-10-15T10:00:00.000Z',
      endDateTime: '2026-10-15T12:00:00.000Z',
      bookingStatus: 'CONFIRMED' as const,
      paymentStatus: 'paid' as const,
    } as any);

    // Query Booking B: 12:00 -> 14:00 (Touches at exact boundary 12:00)
    const avail = await checkVehicleAvailability({
      vehicleId: testVehicle._id,
      startDateTime: '2026-10-15T12:00:00.000Z',
      endDateTime: '2026-10-15T14:00:00.000Z',
    });

    assert.strictEqual(avail.isAvailable, true, 'Adjacent bookings (startB == endA) must be allowed');

    console.log('  ✅ Test 14 Passed: Back-to-back adjacent bookings touching at boundary are allowed.');
  }

  // =========================================================================
  // TEST 15: Timezone & Multi-day - Overnight Booking Safely Handled
  // =========================================================================
  console.log('Test 15: Timezone & Multi-day - Overnight Booking Safely Handled');
  {
    memoryStore.bookings = [];
    // Booking spanning overnight: Day 1 20:00 -> Day 2 08:00
    memoryStore.bookings.push({
      _id: 'book_overnight_1',
      bookingId: 'MYR-OVERNIGHT-1',
      customerId: customer1.userId,
      customerName: customer1.name,
      customerPhone: customer1.phone,
      hostId: testVehicle.ownerId,
      hostName: testVehicle.ownerName,
      hostPhone: testVehicle.ownerPhone,
      vehicleId: testVehicle._id,
      startDateTime: '2026-10-20T20:00:00.000Z',
      endDateTime: '2026-10-21T08:00:00.000Z',
      bookingStatus: 'CONFIRMED' as const,
      paymentStatus: 'paid' as const,
    } as any);

    // Check Day 1 late night overlap (22:00 -> 23:00) -> should be unavailable
    const overlapAvail = await checkVehicleAvailability({
      vehicleId: testVehicle._id,
      startDateTime: '2026-10-20T22:00:00.000Z',
      endDateTime: '2026-10-20T23:00:00.000Z',
    });
    assert.strictEqual(overlapAvail.isAvailable, false);

    // Check Day 2 daytime (10:00 -> 18:00) -> should be available
    const nextDayAvail = await checkVehicleAvailability({
      vehicleId: testVehicle._id,
      startDateTime: '2026-10-21T10:00:00.000Z',
      endDateTime: '2026-10-21T18:00:00.000Z',
    });
    assert.strictEqual(nextDayAvail.isAvailable, true);

    console.log('  ✅ Test 15 Passed: Overnight booking across date boundaries verified.');
  }

  // =========================================================================
  // TEST 16: Availability API Endpoint - GET /vehicles/:id/availability
  // =========================================================================
  console.log('Test 16: Availability API Endpoint - GET /vehicles/:id/availability');
  {
    const req = {
      params: { id: testVehicle._id },
      query: {
        startDateTime: '2026-10-25T10:00:00.000Z',
        endDateTime: '2026-10-25T14:00:00.000Z',
      },
    } as any;
    const res = createMockResponse();
    await checkAvailability(req, res, noopNext);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.isAvailable, true);
    assert.strictEqual(res.body.vehicleId, testVehicle._id);

    console.log('  ✅ Test 16 Passed: GET /vehicles/:id/availability endpoint returned correct availability.');
  }

  // =========================================================================
  // TEST 17: Database Indexes - Compound Availability & Idempotency Indexes
  // =========================================================================
  console.log('Test 17: Database Indexes - Compound Availability & Idempotency Indexes');
  {
    const indexes = BookingModel.schema.indexes();
    const indexFields = indexes.map((idx: any) => Object.keys(idx[0]).join(','));

    // Check optimized availability index (ESR: vehicleId, bookingStatus, startDateTime, endDateTime)
    const hasAvailIndex = indexFields.some(
      (f: string) => f.includes('vehicleId') && f.includes('bookingStatus') && f.includes('startDateTime')
    );
    assert.ok(hasAvailIndex, 'Compound availability index must exist on BookingSchema');

    // Check customerId + idempotencyKey unique sparse index
    const hasIdemIndex = indexFields.some(
      (f: string) => f.includes('customerId') && f.includes('idempotencyKey')
    );
    assert.ok(hasIdemIndex, 'Compound unique idempotency index must exist on BookingSchema');

    // Check bookingStatus + reservationExpiresAt index
    const hasExpiryIndex = indexFields.some(
      (f: string) => f.includes('bookingStatus') && f.includes('reservationExpiresAt')
    );
    assert.ok(hasExpiryIndex, 'Expiration cleanup index must exist on BookingSchema');

    console.log('  ✅ Test 17 Passed: All required compound MongoDB indexes defined and validated.');
  }

  console.log('\n🎉 ALL 17 PHASE 3A BOOKING AVAILABILITY & CONCURRENCY TESTS PASSED PERFECTLY!\n');
}

runBookingAvailabilityTests().catch((err) => {
  console.error('❌ Phase 3A Test Failure:', err);
  process.exit(1);
});

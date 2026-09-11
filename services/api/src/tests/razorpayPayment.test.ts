import assert from 'assert';
import crypto from 'crypto';
import { ENV } from '../config/env';
import { connectDB } from '../config/db';
import { memoryStore } from '../config/store';
import { razorpayService } from '../services/razorpayService';
import { createPaymentOrder, verifyPayment } from '../controllers/paymentController';

/**
 * Mock Response helper for testing Express controllers directly
 */
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

async function runPaymentTests() {
  console.log('🧪 Starting MyRide Phase 2 Production Razorpay Payment Test Suite...\n');

  // Configure test credentials
  const TEST_KEY_ID = 'rzp_test_MyRideUnitTests';
  const TEST_KEY_SECRET = 'myride_top_secret_hmac_test_key_2026';
  ENV.RAZORPAY_KEY_ID = TEST_KEY_ID;
  ENV.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;
  ENV.USE_MEMORY_STORE = true;
  await connectDB();

  // Set up mock test data in memoryStore
  const customer1Id = 'user_cust_1';
  const customer2Id = 'user_cust_2';

  const booking1: any = {
    _id: 'bk_mongo_id_001',
    id: 'bk_mongo_id_001',
    bookingId: 'MYR-TEST-001',
    customerId: customer1Id,
    customerName: 'Rahul Sharma',
    customerPhone: '9876543210',
    hostId: 'user_host_1',
    hostName: 'Amitabh Verma',
    hostPhone: '9876500001',
    vehicleId: 'veh_1',
    vehicle: { id: 'veh_1', name: 'Hyundai Creta' },
    startDateTime: new Date().toISOString(),
    endDateTime: new Date(Date.now() + 86400000).toISOString(),
    durationDays: 1,
    pickupType: 'self_pickup',
    pickupLocation: 'Lucknow Hub',
    dropoffLocation: 'Lucknow Hub',
    pricing: {
      baseAmount: 2000,
      durationDays: 1,
      deliveryFee: 0,
      commissionRate: 15,
      commissionAmount: 300,
      taxes: 54,
      discount: 0,
      securityDeposit: 2000,
      totalAmount: 4354,
      hostEarnings: 1700,
    },
    paymentStatus: 'pending',
    bookingStatus: 'PAYMENT_PENDING',
    razorpayOrderId: 'order_test_rzp_001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const bookingCancelled: any = {
    _id: 'bk_mongo_id_cancelled',
    id: 'bk_mongo_id_cancelled',
    bookingId: 'MYR-TEST-CANCELLED',
    customerId: customer1Id,
    customerName: 'Rahul Sharma',
    customerPhone: '9876543210',
    hostId: 'user_host_1',
    hostName: 'Amitabh Verma',
    hostPhone: '9876500001',
    vehicleId: 'veh_1',
    vehicle: { id: 'veh_1', name: 'Hyundai Creta' },
    startDateTime: new Date().toISOString(),
    endDateTime: new Date(Date.now() + 86400000).toISOString(),
    durationDays: 1,
    pickupType: 'self_pickup',
    pickupLocation: 'Lucknow Hub',
    dropoffLocation: 'Lucknow Hub',
    pricing: { totalAmount: 4354 },
    paymentStatus: 'failed',
    bookingStatus: 'CANCELLED',
    razorpayOrderId: 'order_test_rzp_cancelled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const bookingAlreadyPaid: any = {
    _id: 'bk_mongo_id_paid',
    id: 'bk_mongo_id_paid',
    bookingId: 'MYR-TEST-PAID',
    customerId: customer1Id,
    customerName: 'Rahul Sharma',
    customerPhone: '9876543210',
    hostId: 'user_host_1',
    hostName: 'Amitabh Verma',
    hostPhone: '9876500001',
    vehicleId: 'veh_1',
    vehicle: { id: 'veh_1', name: 'Hyundai Creta' },
    startDateTime: new Date().toISOString(),
    endDateTime: new Date(Date.now() + 86400000).toISOString(),
    durationDays: 1,
    pickupType: 'self_pickup',
    pickupLocation: 'Lucknow Hub',
    dropoffLocation: 'Lucknow Hub',
    pricing: { totalAmount: 4354 },
    paymentStatus: 'paid',
    bookingStatus: 'CONFIRMED',
    razorpayOrderId: 'order_test_rzp_paid',
    razorpayPaymentId: 'pay_test_already_paid',
    paidAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryStore.bookings = [booking1, bookingCancelled, bookingAlreadyPaid];
  memoryStore.payments = [];

  // ==========================================
  // Test A: Valid Payment Signature -> PASS
  // ==========================================
  console.log('Test A: Valid payment signature cryptographically verified via HMAC-SHA256');
  const validOrderId = 'order_test_rzp_001';
  const validPaymentId = 'pay_test_rzp_valid_001';
  const validSignature = razorpayService.generateSignatureForTesting(
    validOrderId,
    validPaymentId,
    TEST_KEY_SECRET
  );

  const reqA: any = {
    user: { userId: customer1Id },
    body: {
      bookingId: 'MYR-TEST-001',
      razorpayOrderId: validOrderId,
      razorpayPaymentId: validPaymentId,
      razorpaySignature: validSignature,
      paymentMethod: 'upi',
    },
  };
  const resA = createMockResponse();
  await verifyPayment(reqA, resA, (err) => {
    if (err) throw err;
  });

  assert.strictEqual(resA.statusCode, 200, 'Status code should be 200 OK');
  assert.strictEqual(resA.body.success, true, 'Response success should be true');
  assert.strictEqual(booking1.paymentStatus, 'paid', 'Booking paymentStatus should be "paid"');
  assert.strictEqual(booking1.bookingStatus, 'CONFIRMED', 'Booking status should be "CONFIRMED"');
  assert.strictEqual(booking1.razorpayPaymentId, validPaymentId, 'Payment ID should be stored on booking');
  assert.strictEqual(memoryStore.payments.length, 1, 'Payment record must be persisted');
  assert.strictEqual(memoryStore.payments[0].status, 'captured', 'Payment status must be captured');
  assert.strictEqual(memoryStore.payments[0].amountPaise, 435400, 'Payment amount must match quote total in paise');
  console.log('  ✅ Test A Passed: Valid signature verified, booking confirmed, payment recorded.');

  // ==========================================
  // Test B: Invalid Signature -> REJECT (HTTP 400)
  // ==========================================
  console.log('\nTest B: Corrupted or forged signature rejected without confirming booking');
  const freshBookingB: any = {
    ...booking1,
    bookingId: 'MYR-TEST-002',
    razorpayOrderId: 'order_test_rzp_002',
    paymentStatus: 'pending',
    bookingStatus: 'PAYMENT_PENDING',
    razorpayPaymentId: undefined,
  };
  memoryStore.bookings.push(freshBookingB);

  const reqB: any = {
    user: { userId: customer1Id },
    body: {
      bookingId: 'MYR-TEST-002',
      razorpayOrderId: 'order_test_rzp_002',
      razorpayPaymentId: 'pay_test_forged',
      razorpaySignature: 'forged_fake_signature_hex_1234567890abcdef1234567890abcdef',
      paymentMethod: 'card',
    },
  };
  const resB = createMockResponse();
  await verifyPayment(reqB, resB, (err) => {
    if (err) throw err;
  });

  assert.strictEqual(resB.statusCode, 400, 'Invalid signature must return HTTP 400');
  assert.strictEqual(resB.body.success, false, 'Success must be false on invalid signature');
  assert.strictEqual(freshBookingB.paymentStatus, 'pending', 'Booking paymentStatus must remain pending');
  assert.strictEqual(freshBookingB.bookingStatus, 'PAYMENT_PENDING', 'Booking status must remain PAYMENT_PENDING');
  console.log('  ✅ Test B Passed: Forged signature rejected, booking remains PAYMENT_PENDING.');

  // ==========================================
  // Test C: Wrong Order ID -> REJECT
  // ==========================================
  console.log('\nTest C: Order ID mismatch with booking rejected');
  const wrongOrderId = 'order_rzp_unrelated_order_999';
  const wrongOrderPaymentId = 'pay_rzp_wrong_order_001';
  const wrongOrderSig = razorpayService.generateSignatureForTesting(
    wrongOrderId,
    wrongOrderPaymentId,
    TEST_KEY_SECRET
  );

  const reqC: any = {
    user: { userId: customer1Id },
    body: {
      bookingId: 'MYR-TEST-002',
      razorpayOrderId: wrongOrderId,
      razorpayPaymentId: wrongOrderPaymentId,
      razorpaySignature: wrongOrderSig,
      paymentMethod: 'upi',
    },
  };
  const resC = createMockResponse();
  await verifyPayment(reqC, resC, (err) => {
    if (err) throw err;
  });

  assert.strictEqual(resC.statusCode, 400, 'Order ID mismatch must return HTTP 400');
  assert.strictEqual(resC.body.success, false, 'Success must be false when order ID mismatch');
  assert.strictEqual(freshBookingB.bookingStatus, 'PAYMENT_PENDING', 'Booking status unchanged');
  console.log('  ✅ Test C Passed: Mismatched order ID rejected.');

  // ==========================================
  // Test D: Wrong Booking ID -> REJECT (404)
  // ==========================================
  console.log('\nTest D: Non-existent booking ID rejected');
  const reqD: any = {
    user: { userId: customer1Id },
    body: {
      bookingId: 'MYR-NON-EXISTENT-BOOKING',
      razorpayOrderId: 'order_test_rzp_001',
      razorpayPaymentId: 'pay_test_xyz',
      razorpaySignature: validSignature,
      paymentMethod: 'upi',
    },
  };
  const resD = createMockResponse();
  await verifyPayment(reqD, resD, (err) => {
    if (err) throw err;
  });

  assert.strictEqual(resD.statusCode, 404, 'Non-existent booking must return 404');
  assert.strictEqual(resD.body.success, false);
  console.log('  ✅ Test D Passed: Non-existent booking ID returns 404.');

  // ==========================================
  // Test E: Authoritative Amount Enforced (Amount Tampering Prevented)
  // ==========================================
  console.log('\nTest E: Server authoritative amount enforced; client cannot tamper with amount');
  // Customer attempts to verify payment with tampered amount in request body
  const reqE: any = {
    user: { userId: customer1Id },
    body: {
      bookingId: 'MYR-TEST-002',
      razorpayOrderId: 'order_test_rzp_002',
      razorpayPaymentId: 'pay_test_tampered_attempt',
      razorpaySignature: razorpayService.generateSignatureForTesting(
        'order_test_rzp_002',
        'pay_test_tampered_attempt',
        TEST_KEY_SECRET
      ),
      paymentMethod: 'upi',
      amount: 1, // Malicious attempt to pay ₹1 instead of ₹4,354
    },
  };
  const resE = createMockResponse();
  await verifyPayment(reqE, resE, (err) => {
    if (err) throw err;
  });

  assert.strictEqual(resE.statusCode, 200, 'Verification succeeds against server amount');
  const recordedPayment = memoryStore.payments.find((p) => p.razorpayPaymentId === 'pay_test_tampered_attempt');
  assert.strictEqual(
    recordedPayment.amountPaise,
    435400,
    'Recorded payment must strictly equal authoritative DB amount (₹4354 = 435400 paise), NOT ₹1'
  );
  console.log('  ✅ Test E Passed: Client tampered amount ignored; server quote (₹4,354) enforced.');

  // ==========================================
  // Test F: Wrong User -> REJECT (403)
  // ==========================================
  console.log('\nTest F: Customer cannot verify or pay for another customer\'s booking');
  const freshBookingF: any = {
    ...booking1,
    bookingId: 'MYR-TEST-003',
    customerId: customer1Id,
    razorpayOrderId: 'order_test_rzp_003',
    paymentStatus: 'pending',
    bookingStatus: 'PAYMENT_PENDING',
  };
  memoryStore.bookings.push(freshBookingF);

  const reqF: any = {
    user: { userId: customer2Id }, // Customer 2 attempts to pay for Customer 1's booking
    body: {
      bookingId: 'MYR-TEST-003',
      razorpayOrderId: 'order_test_rzp_003',
      razorpayPaymentId: 'pay_test_wrong_user',
      razorpaySignature: razorpayService.generateSignatureForTesting(
        'order_test_rzp_003',
        'pay_test_wrong_user',
        TEST_KEY_SECRET
      ),
      paymentMethod: 'upi',
    },
  };
  const resF = createMockResponse();
  await verifyPayment(reqF, resF, (err) => {
    if (err) throw err;
  });

  assert.strictEqual(resF.statusCode, 403, 'Unauthorized customer access must return HTTP 403 Forbidden');
  assert.strictEqual(resF.body.success, false);
  console.log('  ✅ Test F Passed: Cross-customer payment rejected with 403 Forbidden.');

  // ==========================================
  // Test G: Duplicate Verification -> Idempotent
  // ==========================================
  console.log('\nTest G: Idempotent verification handles repeated webhook/app callbacks safely');
  const paymentCountBefore = memoryStore.payments.length;

  const reqG: any = {
    user: { userId: customer1Id },
    body: {
      bookingId: 'MYR-TEST-001',
      razorpayOrderId: validOrderId,
      razorpayPaymentId: validPaymentId,
      razorpaySignature: validSignature,
      paymentMethod: 'upi',
    },
  };
  const resG = createMockResponse();
  await verifyPayment(reqG, resG, (err) => {
    if (err) throw err;
  });

  assert.strictEqual(resG.statusCode, 200, 'Idempotent request must return 200 OK');
  assert.strictEqual(resG.body.success, true);
  assert.strictEqual(resG.body.idempotent, true, 'Must indicate idempotent handling');
  assert.strictEqual(memoryStore.payments.length, paymentCountBefore, 'Must NOT create duplicate payment records');
  console.log('  ✅ Test G Passed: Idempotent response returned, duplicate payment record prevented.');

  // ==========================================
  // Test H: Already Paid Booking -> Safe Response
  // ==========================================
  console.log('\nTest H: Already paid booking returns safe confirmation status');
  const reqH: any = {
    user: { userId: customer1Id },
    body: {
      bookingId: 'MYR-TEST-PAID',
      razorpayOrderId: 'order_test_rzp_paid',
      razorpayPaymentId: 'pay_test_second_attempt',
      razorpaySignature: razorpayService.generateSignatureForTesting(
        'order_test_rzp_paid',
        'pay_test_second_attempt',
        TEST_KEY_SECRET
      ),
      paymentMethod: 'upi',
    },
  };
  const resH = createMockResponse();
  await verifyPayment(reqH, resH, (err) => {
    if (err) throw err;
  });

  assert.strictEqual(resH.statusCode, 200);
  assert.strictEqual(resH.body.success, true);
  assert.strictEqual(resH.body.idempotent, true);
  console.log('  ✅ Test H Passed: Already paid booking handled safely.');

  // ==========================================
  // Test I: Cancelled Booking -> REJECT (HTTP 400)
  // ==========================================
  console.log('\nTest I: Payment rejected on cancelled booking');
  const reqI: any = {
    user: { userId: customer1Id },
    body: {
      bookingId: 'MYR-TEST-CANCELLED',
      razorpayOrderId: 'order_test_rzp_cancelled',
      razorpayPaymentId: 'pay_test_cancelled',
      razorpaySignature: razorpayService.generateSignatureForTesting(
        'order_test_rzp_cancelled',
        'pay_test_cancelled',
        TEST_KEY_SECRET
      ),
      paymentMethod: 'upi',
    },
  };
  const resI = createMockResponse();
  await verifyPayment(reqI, resI, (err) => {
    if (err) throw err;
  });

  assert.strictEqual(resI.statusCode, 400, 'Payment on cancelled booking must return HTTP 400');
  assert.strictEqual(resI.body.success, false);
  assert.strictEqual(bookingCancelled.bookingStatus, 'CANCELLED', 'Cancelled booking must remain CANCELLED');
  console.log('  ✅ Test I Passed: Payment on cancelled booking rejected.');

  // ==========================================
  // Test J: Missing Credentials / Payment Failure -> Not Confirmed
  // ==========================================
  console.log('\nTest J: Missing credentials strictly returns 503 without fake success');
  const savedSecret = ENV.RAZORPAY_KEY_SECRET;
  ENV.RAZORPAY_KEY_SECRET = '';

  const freshBookingJ: any = {
    ...booking1,
    bookingId: 'MYR-TEST-004',
    razorpayOrderId: 'order_test_rzp_004',
    paymentStatus: 'pending',
    bookingStatus: 'PAYMENT_PENDING',
  };
  memoryStore.bookings.push(freshBookingJ);

  const reqJ: any = {
    user: { userId: customer1Id },
    body: {
      bookingId: 'MYR-TEST-004',
      razorpayOrderId: 'order_test_rzp_004',
      razorpayPaymentId: 'pay_test_004',
      razorpaySignature: 'any_sig',
      paymentMethod: 'upi',
    },
  };
  const resJ = createMockResponse();
  await verifyPayment(reqJ, resJ, (err) => {
    if (err) throw err;
  });

  assert.strictEqual(resJ.statusCode, 503, 'Missing secret must return HTTP 503 Service Unavailable');
  assert.strictEqual(resJ.body.success, false);
  assert.strictEqual(freshBookingJ.bookingStatus, 'PAYMENT_PENDING', 'Booking must remain in PAYMENT_PENDING');
  assert.strictEqual(freshBookingJ.paymentStatus, 'pending', 'Payment status must remain pending');

  // Restore secret
  ENV.RAZORPAY_KEY_SECRET = savedSecret;
  console.log('  ✅ Test J Passed: Missing credentials returned 503; app remains in PAYMENT_PENDING without fake confirmation.');

  console.log('\n🎉 ALL 10 PRODUCTION RAZORPAY PAYMENT TESTS PASSED PERFECTLY!\n');
}

runPaymentTests().catch((err) => {
  console.error('❌ Razorpay Payment Tests Failed:', err);
  process.exit(1);
});

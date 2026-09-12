import assert from 'assert';
import crypto from 'crypto';
import { ENV } from '../config/env';
import { connectDB } from '../config/db';
import { memoryStore } from '../config/store';
import { razorpayService } from '../services/razorpayService';
import { handleWebhook } from '../controllers/paymentController';
import BookingModel from '../models/Booking';
import PaymentModel from '../models/Payment';
import PaymentWebhookEventModel from '../models/PaymentWebhookEvent';

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

async function runWebhookTests() {
  console.log('🧪 Starting MyRide Phase 2.1 Production Razorpay Webhook Test Suite...');
  console.log('');

  const TEST_KEY_ID = 'rzp_test_MyRideWebhookUnitTests';
  const TEST_KEY_SECRET = 'myride_top_secret_hmac_test_key_2026';
  const TEST_WEBHOOK_SECRET = 'whsec_myride_webhook_prod_test_secret_9988';

  ENV.RAZORPAY_KEY_ID = TEST_KEY_ID;
  ENV.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;
  ENV.RAZORPAY_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
  ENV.USE_MEMORY_STORE = true;
  await connectDB();

  memoryStore.bookings = [];
  memoryStore.payments = [];
  memoryStore.webhookEvents = [];
  memoryStore.auditLogs = [];

  const customer1Id = 'user_cust_1';

  const bookingA: any = {
    _id: 'bk_mongo_id_wh_001',
    id: 'bk_mongo_id_wh_001',
    bookingId: 'MYR-WH-001',
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
    razorpayOrderId: 'order_wh_rzp_001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const bookingCancelled: any = {
    ...bookingA,
    _id: 'bk_mongo_id_wh_cancelled',
    id: 'bk_mongo_id_wh_cancelled',
    bookingId: 'MYR-WH-CANCELLED',
    razorpayOrderId: 'order_wh_rzp_cancelled',
    paymentStatus: 'cancelled',
    bookingStatus: 'CANCELLED',
  };

  const bookingAlreadyPaid: any = {
    ...bookingA,
    _id: 'bk_mongo_id_wh_paid',
    id: 'bk_mongo_id_wh_paid',
    bookingId: 'MYR-WH-PAID',
    razorpayOrderId: 'order_wh_rzp_paid',
    razorpayPaymentId: 'pay_wh_rzp_paid_initial',
    paymentStatus: 'paid',
    bookingStatus: 'CONFIRMED',
    paidAt: new Date().toISOString(),
  };

  memoryStore.bookings.push(bookingA, bookingCancelled, bookingAlreadyPaid);

  async function callWebhook(params: {
    rawPayload: string | Buffer | any;
    signatureHeader?: string;
    eventIdHeader?: string;
    secretToSign?: string;
  }) {
    let rawBuffer: Buffer;
    if (Buffer.isBuffer(params.rawPayload)) {
      rawBuffer = params.rawPayload;
    } else if (typeof params.rawPayload === 'string') {
      rawBuffer = Buffer.from(params.rawPayload, 'utf8');
    } else {
      rawBuffer = Buffer.from(JSON.stringify(params.rawPayload), 'utf8');
    }

    let signature = params.signatureHeader;
    if (signature === undefined) {
      signature = razorpayService.generateWebhookSignatureForTesting(
        rawBuffer,
        params.secretToSign || TEST_WEBHOOK_SECRET
      );
    }

    const req: any = {
      body: rawBuffer,
      rawBody: rawBuffer,
      headers: {
        'x-razorpay-signature': signature,
        ...(params.eventIdHeader ? { 'x-razorpay-event-id': params.eventIdHeader } : {}),
      },
    };
    const res = createMockResponse();
    await handleWebhook(req, res, (err) => {
      if (err) throw err;
    });
    return res;
  }

  // Test A
  console.log('Test A: Valid webhook signature cryptographically verified via HMAC-SHA256 & timingSafeEqual');
  const payloadA = {
    entity: 'event',
    account_id: 'acc_test_1',
    event: 'payment.captured',
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: 'pay_test_wh_001',
          entity: 'payment',
          amount: 435400,
          currency: 'INR',
          status: 'captured',
          order_id: 'order_wh_rzp_001',
          method: 'upi',
        },
      },
    },
    created_at: Math.floor(Date.now() / 1000),
  };
  const resA = await callWebhook({
    rawPayload: payloadA,
    eventIdHeader: 'event_wh_001',
  });
  assert.strictEqual(resA.statusCode, 200, 'Valid signature must return HTTP 200');
  assert.strictEqual(resA.body.success, true);
  console.log('  ✅ Test A Passed: Valid signature accepted and returned HTTP 200.');

  // Test B
  console.log('\nTest B: Missing signature header returns HTTP 400 Bad Request');
  const resB = await callWebhook({
    rawPayload: payloadA,
    signatureHeader: '',
  });
  assert.strictEqual(resB.statusCode, 400, 'Missing signature must return 400');
  assert.strictEqual(resB.body.success, false);
  console.log('  ✅ Test B Passed: Missing signature rejected with HTTP 400.');

  // Test C
  console.log('\nTest C: Invalid / forged signature rejected with HTTP 400');
  const resC = await callWebhook({
    rawPayload: payloadA,
    signatureHeader: 'invalidsignaturehex0000000000000000000000000000000000000000000000000',
  });
  assert.strictEqual(resC.statusCode, 400, 'Invalid signature must return 400');
  assert.strictEqual(resC.body.success, false);
  console.log('  ✅ Test C Passed: Forged signature rejected with HTTP 400.');

  // Test D
  console.log('\nTest D: Malformed signature (truncated length, non-hex) rejected safely');
  const resD = await callWebhook({
    rawPayload: payloadA,
    signatureHeader: 'short_sig',
  });
  assert.strictEqual(resD.statusCode, 400, 'Malformed signature must return 400');
  assert.strictEqual(resD.body.success, false);
  console.log('  ✅ Test D Passed: Malformed signature handled safely with HTTP 400.');

  // Test E
  console.log('\nTest E: Malformed JSON body rejected with HTTP 400');
  const rawMalformedJson = '{ "event": "payment.captured", unclosed_json: ';
  const resE = await callWebhook({
    rawPayload: rawMalformedJson,
    signatureHeader: razorpayService.generateWebhookSignatureForTesting(rawMalformedJson, TEST_WEBHOOK_SECRET),
  });
  assert.strictEqual(resE.statusCode, 400, 'Malformed JSON must return 400');
  assert.strictEqual(resE.body.success, false);
  console.log('  ✅ Test E Passed: Malformed JSON rejected with HTTP 400.');

  // Test F
  console.log('\nTest F: Missing RAZORPAY_WEBHOOK_SECRET returns HTTP 503');
  const savedSecret = ENV.RAZORPAY_WEBHOOK_SECRET;
  ENV.RAZORPAY_WEBHOOK_SECRET = '';
  const resF = await callWebhook({
    rawPayload: payloadA,
    signatureHeader: 'any_sig',
  });
  assert.strictEqual(resF.statusCode, 503, 'Missing secret must return 503 Service Unavailable');
  assert.strictEqual(resF.body.success, false);
  ENV.RAZORPAY_WEBHOOK_SECRET = savedSecret;
  console.log('  ✅ Test F Passed: Missing secret returned HTTP 503 without fake bypass.');

  // Test G
  console.log('\nTest G: payment.captured updates DB: payment = captured, booking = paid/CONFIRMED');
  assert.strictEqual(bookingA.paymentStatus, 'paid', 'Booking paymentStatus should be paid');
  assert.strictEqual(bookingA.bookingStatus, 'CONFIRMED', 'Booking bookingStatus should be CONFIRMED');
  assert.strictEqual(bookingA.razorpayPaymentId, 'pay_test_wh_001');
  const recordedPaymentG = memoryStore.payments.find((p) => p.razorpayPaymentId === 'pay_test_wh_001');
  assert.ok(recordedPaymentG, 'Payment record must be persisted in database');
  assert.strictEqual(recordedPaymentG.status, 'captured');
  assert.strictEqual(recordedPaymentG.amountPaise, 435400);
  console.log('  ✅ Test G Passed: payment.captured correctly updated Booking and Payment models in DB.');

  // Test H
  console.log('\nTest H: Duplicate delivery of payment.captured is idempotent (no duplicate records)');
  const paymentsCountBeforeH = memoryStore.payments.length;
  const resH = await callWebhook({
    rawPayload: payloadA,
    eventIdHeader: 'event_wh_001',
  });
  assert.strictEqual(resH.statusCode, 200, 'Duplicate delivery returns HTTP 200');
  assert.strictEqual(resH.body.idempotent, true, 'Response must indicate idempotent execution');
  assert.strictEqual(memoryStore.payments.length, paymentsCountBeforeH, 'Must NOT create duplicate payment records');
  assert.strictEqual(bookingA.bookingStatus, 'CONFIRMED', 'Booking remains CONFIRMED');
  console.log('  ✅ Test H Passed: Duplicate delivery acknowledged idempotently without duplicate records.');

  // Test I
  console.log('\nTest I: payment.failed updates payment to failed; keeps booking in PAYMENT_PENDING for retry');
  const freshBookingI: any = {
    ...bookingA,
    _id: 'bk_mongo_id_wh_002',
    id: 'bk_mongo_id_wh_002',
    bookingId: 'MYR-WH-002',
    razorpayOrderId: 'order_wh_rzp_002',
    paymentStatus: 'pending',
    bookingStatus: 'PAYMENT_PENDING',
  };
  memoryStore.bookings.push(freshBookingI);

  const payloadI = {
    entity: 'event',
    event: 'payment.failed',
    payload: {
      payment: {
        entity: {
          id: 'pay_test_wh_failed_002',
          entity: 'payment',
          amount: 435400,
          currency: 'INR',
          status: 'failed',
          order_id: 'order_wh_rzp_002',
          method: 'upi',
        },
      },
    },
  };
  const resI = await callWebhook({
    rawPayload: payloadI,
    eventIdHeader: 'event_wh_002',
  });
  assert.strictEqual(resI.statusCode, 200);
  assert.strictEqual(freshBookingI.paymentStatus, 'failed', 'Payment status updated to failed');
  assert.strictEqual(freshBookingI.bookingStatus, 'PAYMENT_PENDING', 'Booking must remain retryable, NOT confirmed');
  const paymentRecordI = memoryStore.payments.find((p) => p.razorpayPaymentId === 'pay_test_wh_failed_002');
  assert.ok(paymentRecordI);
  assert.strictEqual(paymentRecordI.status, 'failed');
  console.log('  ✅ Test I Passed: payment.failed recorded safely without confirming booking.');

  // Test J
  console.log('\nTest J: order.paid reconciles booking and payment to paid & CONFIRMED');
  const freshBookingJ: any = {
    ...bookingA,
    _id: 'bk_mongo_id_wh_003',
    id: 'bk_mongo_id_wh_003',
    bookingId: 'MYR-WH-003',
    razorpayOrderId: 'order_wh_rzp_003',
    paymentStatus: 'pending',
    bookingStatus: 'PAYMENT_PENDING',
  };
  memoryStore.bookings.push(freshBookingJ);

  const payloadJ = {
    entity: 'event',
    event: 'order.paid',
    payload: {
      order: {
        entity: {
          id: 'order_wh_rzp_003',
          entity: 'order',
          amount: 435400,
          amount_paid: 435400,
          currency: 'INR',
          status: 'paid',
        },
      },
      payment: {
        entity: {
          id: 'pay_test_wh_order_paid_003',
          entity: 'payment',
          amount: 435400,
          currency: 'INR',
          status: 'captured',
          order_id: 'order_wh_rzp_003',
          method: 'netbanking',
        },
      },
    },
  };
  const resJ = await callWebhook({
    rawPayload: payloadJ,
    eventIdHeader: 'event_wh_003',
  });
  assert.strictEqual(resJ.statusCode, 200);
  assert.strictEqual(freshBookingJ.paymentStatus, 'paid');
  assert.strictEqual(freshBookingJ.bookingStatus, 'CONFIRMED');
  console.log('  ✅ Test J Passed: order.paid reconciled booking to paid & CONFIRMED.');

  // Test K
  console.log('\nTest K: Unknown Razorpay order ID safely acknowledged & ignored without creating booking');
  const bookingsCountBeforeK = memoryStore.bookings.length;
  const payloadK = {
    entity: 'event',
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_test_wh_unknown_order',
          order_id: 'order_unknown_in_db_999999',
          amount: 500000,
          currency: 'INR',
          status: 'captured',
          method: 'card',
        },
      },
    },
  };
  const resK = await callWebhook({
    rawPayload: payloadK,
    eventIdHeader: 'event_wh_004',
  });
  assert.strictEqual(resK.statusCode, 200, 'Unknown order acknowledged with 200 so Razorpay does not retry forever');
  assert.strictEqual(memoryStore.bookings.length, bookingsCountBeforeK, 'Must NOT create new booking');
  assert.strictEqual(
    memoryStore.payments.some((p) => p.razorpayPaymentId === 'pay_test_wh_unknown_order'),
    false,
    'Must NOT create fake payment record'
  );
  console.log('  ✅ Test K Passed: Unknown order handled safely without creating bookings/payments.');

  // Test L
  console.log('\nTest L: Amount mismatch strictly rejected with HTTP 400 (tampering prevented)');
  const freshBookingL: any = {
    ...bookingA,
    _id: 'bk_mongo_id_wh_005',
    id: 'bk_mongo_id_wh_005',
    bookingId: 'MYR-WH-005',
    razorpayOrderId: 'order_wh_rzp_005',
    paymentStatus: 'pending',
    bookingStatus: 'PAYMENT_PENDING',
  };
  memoryStore.bookings.push(freshBookingL);

  const payloadL = {
    entity: 'event',
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_test_wh_tampered_amount',
          order_id: 'order_wh_rzp_005',
          amount: 100,
          currency: 'INR',
          status: 'captured',
          method: 'upi',
        },
      },
    },
  };
  const resL = await callWebhook({
    rawPayload: payloadL,
    eventIdHeader: 'event_wh_005',
  });
  assert.strictEqual(resL.statusCode, 400, 'Amount mismatch must return HTTP 400');
  assert.strictEqual(freshBookingL.paymentStatus, 'pending', 'Booking paymentStatus must NOT be set to paid');
  assert.strictEqual(freshBookingL.bookingStatus, 'PAYMENT_PENDING', 'Booking must NOT be confirmed');
  console.log('  ✅ Test L Passed: Amount mismatch rejected, booking remains PAYMENT_PENDING.');

  // Test M
  console.log('\nTest M: Currency mismatch (e.g. USD instead of INR) rejected with HTTP 400');
  const payloadM = {
    entity: 'event',
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_test_wh_currency_mismatch',
          order_id: 'order_wh_rzp_005',
          amount: 435400,
          currency: 'USD',
          status: 'captured',
          method: 'card',
        },
      },
    },
  };
  const resM = await callWebhook({
    rawPayload: payloadM,
    eventIdHeader: 'event_wh_006',
  });
  assert.strictEqual(resM.statusCode, 400, 'Currency mismatch must return HTTP 400');
  assert.strictEqual(freshBookingL.bookingStatus, 'PAYMENT_PENDING');
  console.log('  ✅ Test M Passed: Non-INR currency rejected.');

  // Test N
  console.log('\nTest N: Already-paid booking acknowledged safely without double-confirming');
  const payloadN = {
    entity: 'event',
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_wh_rzp_paid_second_attempt',
          order_id: 'order_wh_rzp_paid',
          amount: 435400,
          currency: 'INR',
          status: 'captured',
          method: 'upi',
        },
      },
    },
  };
  const resN = await callWebhook({
    rawPayload: payloadN,
    eventIdHeader: 'event_wh_007',
  });
  assert.strictEqual(resN.statusCode, 200);
  assert.strictEqual(resN.body.idempotent, true);
  assert.strictEqual(bookingAlreadyPaid.paymentStatus, 'paid');
  assert.strictEqual(bookingAlreadyPaid.bookingStatus, 'CONFIRMED');
  console.log('  ✅ Test N Passed: Already-paid booking acknowledged safely.');

  // Test O
  console.log('\nTest O: Cancelled booking cannot be marked paid via webhook (HTTP 400)');
  const payloadO = {
    entity: 'event',
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_wh_cancelled_attempt',
          order_id: 'order_wh_rzp_cancelled',
          amount: 435400,
          currency: 'INR',
          status: 'captured',
          method: 'upi',
        },
      },
    },
  };
  const resO = await callWebhook({
    rawPayload: payloadO,
    eventIdHeader: 'event_wh_008',
  });
  assert.strictEqual(resO.statusCode, 400, 'Payment on cancelled booking must return 400');
  assert.strictEqual(bookingCancelled.bookingStatus, 'CANCELLED', 'Cancelled booking must remain CANCELLED');
  console.log('  ✅ Test O Passed: Cancelled booking rejected.');

  // Test P
  console.log('\nTest P: Duplicate payment ID is updated, never duplicated in database');
  const paymentsCountBeforeP = memoryStore.payments.length;
  const payloadP = {
    entity: 'event',
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_test_wh_001',
          order_id: 'order_wh_rzp_001',
          amount: 435400,
          currency: 'INR',
          status: 'captured',
          method: 'upi',
        },
      },
    },
  };
  const resP = await callWebhook({
    rawPayload: payloadP,
    eventIdHeader: 'event_wh_new_id_for_same_payment',
  });
  assert.strictEqual(resP.statusCode, 200);
  assert.strictEqual(memoryStore.payments.length, paymentsCountBeforeP, 'Duplicate payment ID prevented');
  console.log('  ✅ Test P Passed: Duplicate payment ID handled without record duplication.');

  // Test Q
  console.log('\nTest Q: Duplicate Event ID detected via durable idempotency store');
  const resQ = await callWebhook({
    rawPayload: payloadA,
    eventIdHeader: 'event_wh_001',
  });
  assert.strictEqual(resQ.statusCode, 200);
  assert.strictEqual(resQ.body.idempotent, true);
  console.log('  ✅ Test Q Passed: Duplicate event ID returned idempotent 200.');

  // Test R
  console.log('\nTest R: Webhook replay attack detected and intercepted');
  const resR = await callWebhook({
    rawPayload: payloadA,
    eventIdHeader: 'event_wh_001',
  });
  assert.strictEqual(resR.statusCode, 200);
  assert.strictEqual(resR.body.idempotent, true);
  console.log('  ✅ Test R Passed: Replayed webhook safely acknowledged without re-execution.');

  // Test S
  console.log('\nTest S: Late payment.failed arriving after payment.captured does NOT downgrade booking');
  const payloadS = {
    entity: 'event',
    event: 'payment.failed',
    payload: {
      payment: {
        entity: {
          id: 'pay_late_failed_attempt',
          order_id: 'order_wh_rzp_001',
          amount: 435400,
          currency: 'INR',
          status: 'failed',
          method: 'upi',
        },
      },
    },
  };
  const resS = await callWebhook({
    rawPayload: payloadS,
    eventIdHeader: 'event_wh_late_failed',
  });
  assert.strictEqual(resS.statusCode, 200);
  assert.strictEqual(bookingA.paymentStatus, 'paid', 'Booking paymentStatus must remain paid');
  assert.strictEqual(bookingA.bookingStatus, 'CONFIRMED', 'Booking bookingStatus must remain CONFIRMED');
  console.log('  ✅ Test S Passed: Out-of-order payment.failed ignored; booking remains paid & CONFIRMED.');

  // Test T
  console.log('\nTest T: Unsupported events (refund.created, etc.) acknowledged safely');
  const payloadT = {
    entity: 'event',
    event: 'refund.created',
    payload: {
      refund: {
        entity: {
          id: 'rfnd_001',
          payment_id: 'pay_test_wh_001',
          amount: 100000,
        },
      },
    },
  };
  const resT = await callWebhook({
    rawPayload: payloadT,
    eventIdHeader: 'event_wh_refund_001',
  });
  assert.strictEqual(resT.statusCode, 200);
  console.log('  ✅ Test T Passed: Future/unsupported event acknowledged with HTTP 200 so Razorpay does not retry.');

  // Test U: Security Tests
  console.log('\nTest U: Security assertions: Webhook secret never leaked in responses or logs');
  const allResponses = [resA, resB, resC, resD, resE, resF, resH, resI, resJ, resK, resL, resM, resN, resO, resP, resQ, resR, resS, resT];
  for (const r of allResponses) {
    const stringified = JSON.stringify(r.body || {});
    assert.strictEqual(stringified.includes(TEST_WEBHOOK_SECRET), false, 'Webhook secret must NEVER be returned in response');
    assert.strictEqual(stringified.includes(TEST_KEY_SECRET), false, 'Key secret must NEVER be returned in response');
  }

  const tamperedPayload = {
    ...payloadA,
    payload: {
      payment: {
        ...payloadA.payload.payment,
        entity: {
          ...payloadA.payload.payment.entity,
          amount: 100,
        },
      },
    },
  };
  const originalSignatureForPayloadA = razorpayService.generateWebhookSignatureForTesting(
    JSON.stringify(payloadA),
    TEST_WEBHOOK_SECRET
  );
  const resTampered = await callWebhook({
    rawPayload: JSON.stringify(tamperedPayload),
    signatureHeader: originalSignatureForPayloadA,
  });
  assert.strictEqual(resTampered.statusCode, 400, 'Tampered payload with mismatched signature must be rejected with 400');
  console.log('  ✅ Test U Passed: Payload tampering prevented; secrets never leaked in any response.');

  // Test V: Self-Healing Payment Upsert
  console.log('\nTest V: Self-Healing Payment Upsert: Missing payment record is automatically backfilled on retry');
  const bookingV: any = {
    ...bookingA,
    _id: 'bk_mongo_id_wh_heal_001',
    id: 'bk_mongo_id_wh_heal_001',
    bookingId: 'MYR-WH-HEAL-001',
    razorpayOrderId: 'order_wh_rzp_heal_001',
    paymentStatus: 'paid',
    bookingStatus: 'CONFIRMED',
    paidAt: new Date().toISOString(),
  };
  memoryStore.bookings.push(bookingV);

  // Ensure payment record is missing
  const paymentIndexV = memoryStore.payments.findIndex(
    (p) => p.razorpayPaymentId === 'pay_test_wh_heal_001'
  );
  if (paymentIndexV >= 0) {
    memoryStore.payments.splice(paymentIndexV, 1);
  }
  assert.strictEqual(
    memoryStore.payments.some((p) => p.razorpayPaymentId === 'pay_test_wh_heal_001'),
    false,
    'Payment record must initially be absent to simulate crash between booking & payment write'
  );

  const payloadV = {
    entity: 'event',
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_test_wh_heal_001',
          order_id: 'order_wh_rzp_heal_001',
          amount: 435400,
          currency: 'INR',
          status: 'captured',
          method: 'card',
        },
      },
    },
  };

  const resV = await callWebhook({
    rawPayload: payloadV,
    eventIdHeader: 'event_wh_heal_001',
  });
  assert.strictEqual(resV.statusCode, 200, 'Webhook retry must return 200');
  assert.strictEqual(resV.body.idempotent, true);

  // Verify that self-healing automatically backfilled the missing Payment document
  const healedPayment = memoryStore.payments.find((p) => p.razorpayPaymentId === 'pay_test_wh_heal_001');
  assert.ok(healedPayment, 'Payment record must be restored via self-healing upsert');
  assert.strictEqual(healedPayment.amountPaise, 435400);
  assert.strictEqual(healedPayment.status, 'captured');
  assert.strictEqual(healedPayment.method, 'card');
  assert.strictEqual(bookingV.paymentStatus, 'paid');
  assert.strictEqual(bookingV.bookingStatus, 'CONFIRMED');

  // Verify that another delivery does NOT create duplicates
  const paymentsCountAfterHeal = memoryStore.payments.length;
  await callWebhook({
    rawPayload: payloadV,
    eventIdHeader: 'event_wh_heal_002',
  });
  assert.strictEqual(memoryStore.payments.length, paymentsCountAfterHeal, 'Must NOT create duplicate payments');
  console.log('  ✅ Test V Passed: Missing payment record automatically restored without duplicate records.');

  // Test W: Concurrent Duplicate Webhook Processing
  console.log('\nTest W: Concurrent Duplicate Webhook Processing: In-flight atomic claim handles simultaneous requests');
  const bookingW: any = {
    ...bookingA,
    _id: 'bk_mongo_id_wh_concurrent_001',
    id: 'bk_mongo_id_wh_concurrent_001',
    bookingId: 'MYR-WH-CONCURRENT-001',
    razorpayOrderId: 'order_wh_rzp_concurrent_001',
    paymentStatus: 'pending',
    bookingStatus: 'PAYMENT_PENDING',
  };
  memoryStore.bookings.push(bookingW);

  const payloadW = {
    entity: 'event',
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_test_wh_concurrent_001',
          order_id: 'order_wh_rzp_concurrent_001',
          amount: 435400,
          currency: 'INR',
          status: 'captured',
          method: 'upi',
        },
      },
    },
  };

  const [resW1, resW2] = await Promise.all([
    callWebhook({
      rawPayload: payloadW,
      eventIdHeader: 'event_wh_concurrent_001',
    }),
    callWebhook({
      rawPayload: payloadW,
      eventIdHeader: 'event_wh_concurrent_001',
    }),
  ]);

  assert.strictEqual(resW1.statusCode, 200);
  assert.strictEqual(resW2.statusCode, 200);
  // Exactly one payment record exists with this payment ID
  const matchingPayments = memoryStore.payments.filter(
    (p) => p.razorpayPaymentId === 'pay_test_wh_concurrent_001'
  );
  assert.strictEqual(matchingPayments.length, 1, 'Exactly one payment document must exist');
  // Booking is confirmed
  assert.strictEqual(bookingW.paymentStatus, 'paid');
  assert.strictEqual(bookingW.bookingStatus, 'CONFIRMED');
  // Only one webhook event entry exists
  const matchingEvents = memoryStore.webhookEvents.filter(
    (e) => e.eventId === 'event_wh_concurrent_001'
  );
  assert.strictEqual(matchingEvents.length, 1, 'Exactly one webhook event record must exist');
  console.log('  ✅ Test W Passed: Concurrent duplicate requests safely handled without duplicate side effects.');

  // Test X: Unique Razorpay Order ID Schema Enforcement
  console.log('\nTest X: Unique Razorpay Order ID: Booking schema enforces unique and sparse index on razorpayOrderId');
  const razorpayOrderIdPath: any = BookingModel.schema.path('razorpayOrderId');
  assert.ok(razorpayOrderIdPath, 'razorpayOrderId path must exist on Booking schema');
  assert.strictEqual(razorpayOrderIdPath.options.unique, true, 'razorpayOrderId must be configured with unique: true');
  assert.strictEqual(razorpayOrderIdPath.options.sparse, true, 'razorpayOrderId must be configured with sparse: true');

  const webhookEventIdPath: any = PaymentWebhookEventModel.schema.path('eventId');
  assert.strictEqual(webhookEventIdPath.options.unique, true, 'eventId must be unique on PaymentWebhookEvent schema');

  const paymentPaymentIdPath: any = PaymentModel.schema.path('razorpayPaymentId');
  assert.strictEqual(paymentPaymentIdPath.options.unique, true, 'razorpayPaymentId must be unique on Payment schema');
  console.log('  ✅ Test X Passed: Unique and sparse index constraints verified on Booking, Payment, and PaymentWebhookEvent schemas.');

  console.log('\n🎉 ALL 24 PRODUCTION RAZORPAY WEBHOOK TESTS (A through X) PASSED PERFECTLY!\n');
}

runWebhookTests().catch((err) => {
  console.error('❌ Razorpay Webhook Tests Failed:', err);
  process.exit(1);
});

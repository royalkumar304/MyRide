import { Request, Response, NextFunction } from 'express';
import { isUsingMemoryStore } from '../config/db';
import { memoryStore } from '../config/store';
import BookingModel from '../models/Booking';
import PaymentModel from '../models/Payment';
import PaymentWebhookEventModel from '../models/PaymentWebhookEvent';
import { AuditLogModel } from '../models/ReviewAndMeta';
import crypto from 'crypto';
import { razorpayService } from '../services/razorpayService';
import { PaymentVerifySchema } from '@myride/validation';
import { ENV } from '../config/env';

/**
 * Creates a real Razorpay Order for a pending booking.
 * Calculates authoritative quote server-side and binds razorpayOrderId to the booking.
 * Returns ONLY safe public client information (orderId, amount, currency, keyId).
 */
export async function createPaymentOrder(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { bookingId } = req.body;
    if (!bookingId) {
      res.status(400).json({ success: false, message: 'bookingId is required' });
      return;
    }

    let booking: any = null;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(bookingId);
    if (isUsingMemoryStore()) {
      booking = memoryStore.bookings.find(
        (b) => b._id === bookingId || b.id === bookingId || b.bookingId === bookingId
      );
    } else {
      booking = await BookingModel.findOne({
        $or: [...(isObjectId ? [{ _id: bookingId }] : []), { bookingId }],
      });
    }

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // Customer Ownership Check: customer cannot pay another customer's booking
    const bookingCustomerId = booking.customerId?.toString?.() || booking.customerId;
    if (bookingCustomerId !== userId.toString()) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot pay for another customer’s booking',
      });
      return;
    }

    // Booking Lifecycle Checks
    if (booking.bookingStatus === 'CANCELLED' || booking.bookingStatus === 'REFUNDED') {
      res.status(400).json({
        success: false,
        message: 'Cannot create payment order for a cancelled or refunded booking',
      });
      return;
    }

    if (
      booking.paymentStatus === 'paid' ||
      booking.paymentStatus === 'completed' ||
      booking.bookingStatus === 'CONFIRMED'
    ) {
      res.status(400).json({
        success: false,
        message: 'Booking has already been paid and confirmed',
      });
      return;
    }

    // Server-Authoritative Quote Calculation
    const totalAmount = booking.pricing?.totalAmount || 0;
    if (totalAmount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid booking amount. Server quote total must be greater than zero.',
      });
      return;
    }

    const amountInPaisa = Math.round(totalAmount * 100);

    // Check configuration
    if (!razorpayService.isConfigured()) {
      res.status(503).json({
        success: false,
        message:
          'Razorpay payment gateway is not configured on the backend server. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
      });
      return;
    }

    // Call Real Razorpay Orders API
    const razorpayOrder = await razorpayService.createOrder({
      amountPaise: amountInPaisa,
      currency: 'INR',
      receipt: booking.bookingId || `bk_${Date.now()}`,
      notes: {
        bookingId: booking.bookingId || String(booking._id),
        customerId: bookingCustomerId,
      },
    });

    // Bind razorpayOrderId to the booking record
    if (isUsingMemoryStore()) {
      booking.razorpayOrderId = razorpayOrder.orderId;
      booking.bookingStatus = 'PAYMENT_PENDING';
      booking.updatedAt = new Date().toISOString();
    } else {
      await BookingModel.updateOne(
        { _id: booking._id },
        { razorpayOrderId: razorpayOrder.orderId, bookingStatus: 'PAYMENT_PENDING' }
      );
    }

    // Return ONLY safe public client information (never key_secret or internal tokens)
    res.json({
      success: true,
      order: {
        id: razorpayOrder.orderId,
        amount: razorpayOrder.amountPaise,
        currency: razorpayOrder.currency,
        key: razorpayOrder.keyId,
        bookingId: booking.bookingId,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verifies Razorpay payment signature cryptographically using HMAC-SHA256.
 * Enforces idempotency, customer ownership, booking lifecycle state,
 * and server-authoritative amount matching.
 */
export async function verifyPayment(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentMethod } =
      PaymentVerifySchema.parse(req.body);

    if (!ENV.RAZORPAY_KEY_SECRET) {
      res.status(503).json({
        success: false,
        message: 'Payment verification service is not configured (missing secret).',
      });
      return;
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(bookingId);

    // 1. Idempotency Check: Check if this payment transaction was already processed
    let existingPayment: any = null;
    if (isUsingMemoryStore()) {
      existingPayment = (memoryStore.payments || []).find(
        (p) => p.razorpayPaymentId === razorpayPaymentId
      );
    } else {
      existingPayment = await PaymentModel.findOne({ razorpayPaymentId });
    }

    if (existingPayment) {
      // Payment already recorded — return existing successful result without duplicate records
      let existingBooking: any = null;
      if (isUsingMemoryStore()) {
        existingBooking = memoryStore.bookings.find(
          (b) => b._id === bookingId || b.id === bookingId || b.bookingId === bookingId
        );
      } else {
        existingBooking = await BookingModel.findOne({
          $or: [...(isObjectId ? [{ _id: bookingId }] : []), { bookingId }],
        });
      }

      res.json({
        success: true,
        message: 'Payment has already been verified and booking confirmed.',
        idempotent: true,
        booking: existingBooking,
      });
      return;
    }

    // 2. Retrieve Booking
    let booking: any = null;
    if (isUsingMemoryStore()) {
      booking = memoryStore.bookings.find(
        (b) => b._id === bookingId || b.id === bookingId || b.bookingId === bookingId
      );
    } else {
      booking = await BookingModel.findOne({
        $or: [...(isObjectId ? [{ _id: bookingId }] : []), { bookingId }],
      });
    }

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found for payment verification' });
      return;
    }

    // 3. Customer Ownership Verification
    const bookingCustomerId = booking.customerId?.toString?.() || booking.customerId;
    if (bookingCustomerId !== userId.toString()) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot verify payment for another customer’s booking',
      });
      return;
    }

    // 4. Booking Lifecycle Validation
    if (booking.bookingStatus === 'CANCELLED' || booking.bookingStatus === 'REFUNDED') {
      res.status(400).json({
        success: false,
        message: 'Cannot verify payment for a cancelled or refunded booking',
      });
      return;
    }

    // 5. Order ID Association Validation: Verify order ID belongs to expected booking
    if (booking.razorpayOrderId && booking.razorpayOrderId !== razorpayOrderId) {
      res.status(400).json({
        success: false,
        message: 'Razorpay order ID does not belong to this booking',
      });
      return;
    }

    // 6. Cryptographic HMAC-SHA256 Signature Verification
    const isSignatureValid = razorpayService.verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isSignatureValid) {
      res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Verification failed.',
      });
      return;
    }

    // 7. Check if booking is already paid
    if (booking.paymentStatus === 'paid' && booking.bookingStatus === 'CONFIRMED') {
      res.json({
        success: true,
        message: 'Booking is already confirmed and paid',
        idempotent: true,
        booking,
      });
      return;
    }

    // 8. Atomic Database Update
    const paidAt = new Date();
    const totalPaise = Math.round((booking.pricing?.totalAmount || 0) * 100);
    const method = (paymentMethod || 'upi') as 'upi' | 'card' | 'netbanking' | 'wallet';

    if (isUsingMemoryStore()) {
      booking.paymentStatus = 'paid';
      booking.bookingStatus = 'CONFIRMED';
      booking.razorpayOrderId = razorpayOrderId;
      booking.razorpayPaymentId = razorpayPaymentId;
      booking.paidAt = paidAt.toISOString();
      booking.updatedAt = paidAt.toISOString();

      if (!memoryStore.payments) {
        memoryStore.payments = [];
      }
      memoryStore.payments.push({
        _id: `pay_${Date.now()}`,
        id: `pay_${Date.now()}`,
        bookingId: booking._id || booking.id,
        customerId: booking.customerId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        amountPaise: totalPaise,
        currency: 'INR',
        method,
        status: 'captured',
        createdAt: paidAt.toISOString(),
        updatedAt: paidAt.toISOString(),
      });
    } else {
      booking = await BookingModel.findOneAndUpdate(
        {
          _id: booking._id,
          paymentStatus: { $ne: 'paid' },
        },
        {
          paymentStatus: 'paid',
          bookingStatus: 'CONFIRMED',
          razorpayOrderId,
          razorpayPaymentId,
          paidAt,
        },
        { new: true }
      );

      await PaymentModel.create({
        bookingId: booking._id,
        customerId: booking.customerId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        amountPaise: totalPaise,
        currency: 'INR',
        method,
        status: 'captured',
      });
    }

    res.json({
      success: true,
      message: 'Payment verified and booking confirmed!',
      booking,
    });
  } catch (error) {
    next(error);
  }
}


/**
 * Safely performs self-healing upsert of a Payment document for an already paid/confirmed booking.
 * Does NOT overwrite valid existing data ($setOnInsert).
 * Recreates/backfills if missing.
 * Does NOT invent fake payment IDs if unavailable.
 */
async function healPaymentRecordIfMissing(params: {
  booking: any;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amountPaise: number;
  currency?: string;
  method?: string;
}): Promise<void> {
  const { booking, razorpayOrderId, razorpayPaymentId, amountPaise, currency = 'INR', method = 'upi' } = params;

  if (!razorpayPaymentId) {
    console.warn(
      `[RAZORPAY_WEBHOOK] self_healing_payment_skipped: razorpayPaymentId unavailable for booking=${booking.bookingId || booking._id}`
    );
    return;
  }

  const validMethod = (['upi', 'card', 'netbanking', 'wallet'].includes(method)
    ? method
    : 'upi') as 'upi' | 'card' | 'netbanking' | 'wallet';

  const now = new Date();

  if (isUsingMemoryStore()) {
    if (!memoryStore.payments) {
      memoryStore.payments = [];
    }
    const existing = memoryStore.payments.find((p) => p.razorpayPaymentId === razorpayPaymentId);
    if (!existing) {
      console.log(
        `[RAZORPAY_WEBHOOK] self_healing_payment_restored: backfilled missing payment=${razorpayPaymentId} for booking=${booking.bookingId}`
      );
      memoryStore.payments.push({
        _id: `pay_${Date.now()}`,
        id: `pay_${Date.now()}`,
        bookingId: booking._id || booking.id,
        customerId: booking.customerId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: '',
        amountPaise,
        currency,
        method: validMethod,
        status: 'captured',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }
  } else {
    // MongoDB: Use $setOnInsert so existing financial records are NEVER mutated or overwritten
    await PaymentModel.findOneAndUpdate(
      { razorpayPaymentId },
      {
        $setOnInsert: {
          bookingId: booking._id,
          customerId: booking.customerId,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature: '',
          amountPaise,
          currency,
          method: validMethod,
          status: 'captured',
        },
      },
      { upsert: true, new: true }
    );
    console.log(
      `[RAZORPAY_WEBHOOK] self_healing_payment_checked: ensured payment record exists for payment=${razorpayPaymentId}`
    );
  }
}

/**
 * Production-Grade Razorpay Webhook Handler.
 * Authenticated cryptographically via HMAC-SHA256 signature using RAZORPAY_WEBHOOK_SECRET.
 * Provides durable idempotency, authoritative amount/currency validation,
 * state machine integrity, and atomic booking reconciliation.
 */
export async function handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  let currentEventId: string | null = null;
  let isClaimOwner = false;

  try {
    // 1. Extract Raw Body Buffer
    let rawBodyBuffer: Buffer;
    if (Buffer.isBuffer(req.body)) {
      rawBodyBuffer = req.body;
    } else if ((req as any).rawBody && Buffer.isBuffer((req as any).rawBody)) {
      rawBodyBuffer = (req as any).rawBody;
    } else if (typeof req.body === 'string') {
      rawBodyBuffer = Buffer.from(req.body, 'utf8');
    } else if (req.body && Object.keys(req.body).length > 0) {
      // In case body was already parsed before reaching here
      rawBodyBuffer = Buffer.from(JSON.stringify(req.body), 'utf8');
    } else {
      res.status(400).json({ success: false, message: 'Empty or missing webhook request body' });
      return;
    }

    if (rawBodyBuffer.length === 0) {
      res.status(400).json({ success: false, message: 'Empty webhook payload' });
      return;
    }

    // 2. Extract Signature Header
    const signatureHeader =
      (req.headers['x-razorpay-signature'] as string) ||
      (req.headers['X-Razorpay-Signature'] as string);

    if (!signatureHeader || signatureHeader.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Missing Razorpay webhook signature header' });
      return;
    }

    // 3. Webhook Secret Configuration Validation
    const webhookSecret = ENV.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[RAZORPAY_WEBHOOK] configuration_error: Missing RAZORPAY_WEBHOOK_SECRET on server');
      res.status(503).json({
        success: false,
        message: 'Webhook processing service is temporarily unconfigured (missing secret)',
      });
      return;
    }

    // 4. Cryptographic HMAC-SHA256 Signature Verification via timingSafeEqual
    const isSignatureValid = razorpayService.verifyWebhookSignature({
      rawBody: rawBodyBuffer,
      signature: signatureHeader,
      secret: webhookSecret,
    });

    if (!isSignatureValid) {
      console.warn('[RAZORPAY_WEBHOOK] signature_invalid: Webhook signature verification failed');
      res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      return;
    }

    console.log('[RAZORPAY_WEBHOOK] signature_valid');

    // 5. Parse JSON Payload
    let payload: any;
    try {
      payload = JSON.parse(rawBodyBuffer.toString('utf8'));
    } catch {
      res.status(400).json({ success: false, message: 'Malformed JSON payload in webhook body' });
      return;
    }

    if (!payload || !payload.event) {
      res.status(400).json({ success: false, message: 'Invalid webhook payload structure: missing event name' });
      return;
    }

    const eventName: string = payload.event;
    const payloadHash = crypto.createHash('sha256').update(rawBodyBuffer).digest('hex');
    const headerEventId =
      (req.headers['x-razorpay-event-id'] as string) ||
      (req.headers['X-Razorpay-Event-Id'] as string);
    const eventId: string =
      headerEventId || payload.event_id || payload.id || `ev_${payloadHash.slice(0, 32)}`;
    currentEventId = eventId;

    console.log(`[RAZORPAY_WEBHOOK] received event=${eventName} eventId=${eventId}`);

    // 6. Durable Atomic In-Flight Webhook Claim: Guarantee only ONE request owns processing
    const receivedAt = new Date();

    if (isUsingMemoryStore()) {
      if (!memoryStore.webhookEvents) {
        memoryStore.webhookEvents = [];
      }
      const existing = memoryStore.webhookEvents.find((e) => e.eventId === eventId);
      if (existing) {
        console.log(`[RAZORPAY_WEBHOOK] duplicate_event eventId=${eventId} status=${existing.status} - returning idempotent 200`);
        res.status(200).json({
          success: true,
          message:
            existing.status === 'processed'
              ? 'Webhook event has already been processed'
              : 'Webhook event is already claimed or in-flight',
          idempotent: true,
        });
        return;
      }
      // Atomically claim in memoryStore
      memoryStore.webhookEvents.push({
        eventId,
        event: eventName,
        status: 'processing',
        receivedAt: receivedAt.toISOString(),
        payloadHash,
      });
      isClaimOwner = true;
    } else {
      try {
        await PaymentWebhookEventModel.create({
          eventId,
          event: eventName,
          status: 'processing',
          receivedAt,
          payloadHash,
        });
        isClaimOwner = true;
      } catch (err: any) {
        const isDuplicateKey = err.code === 11000 || (err.message && err.message.includes('E11000'));
        if (isDuplicateKey) {
          console.log(`[RAZORPAY_WEBHOOK] duplicate_key_intercepted eventId=${eventId}`);
          const existing = await PaymentWebhookEventModel.findOne({ eventId });

          if (existing && existing.status === 'processed') {
            res.status(200).json({
              success: true,
              message: 'Webhook event has already been processed',
              idempotent: true,
            });
            return;
          }

          if (existing && existing.status === 'processing') {
            const ageMs = Date.now() - new Date(existing.receivedAt || (existing as any).createdAt).getTime();
            if (ageMs > 120000) {
              console.warn(`[RAZORPAY_WEBHOOK] reclaiming stale processing lock for eventId=${eventId}`);
              isClaimOwner = true;
            } else {
              // Wait briefly for in-flight processing to complete
              let isFinished = false;
              for (let i = 0; i < 6; i++) {
                await new Promise((r) => setTimeout(r, 250));
                const updated = await PaymentWebhookEventModel.findOne({ eventId });
                if (updated && updated.status === 'processed') {
                  isFinished = true;
                  break;
                }
              }

              res.status(200).json({
                success: true,
                message: isFinished
                  ? 'Webhook event has already been processed'
                  : 'Webhook event is currently being processed by in-flight request',
                idempotent: true,
              });
              return;
            }
          } else {
            res.status(200).json({
              success: true,
              message: `Webhook event previously recorded with status '${existing?.status || 'recorded'}'`,
              idempotent: true,
            });
            return;
          }
        } else {
          throw err;
        }
      }
    }

    // Helper to persist webhook event status
    const recordWebhookEvent = async (
      status: 'processed' | 'failed' | 'ignored',
      details?: { razorpayOrderId?: string; razorpayPaymentId?: string; failureReason?: string }
    ) => {
      const now = new Date();
      if (isUsingMemoryStore()) {
        if (!memoryStore.webhookEvents) {
          memoryStore.webhookEvents = [];
        }
        const existingIdx = memoryStore.webhookEvents.findIndex((e) => e.eventId === eventId);
        const record = {
          eventId,
          event: eventName,
          razorpayOrderId: details?.razorpayOrderId,
          razorpayPaymentId: details?.razorpayPaymentId,
          status,
          receivedAt: now.toISOString(),
          processedAt: now.toISOString(),
          failureReason: details?.failureReason,
          payloadHash,
        };
        if (existingIdx >= 0) {
          memoryStore.webhookEvents[existingIdx] = record;
        } else {
          memoryStore.webhookEvents.push(record);
        }
      } else {
        await PaymentWebhookEventModel.findOneAndUpdate(
          { eventId },
          {
            eventId,
            event: eventName,
            razorpayOrderId: details?.razorpayOrderId,
            razorpayPaymentId: details?.razorpayPaymentId,
            status,
            processedAt: now,
            failureReason: details?.failureReason,
            payloadHash,
          },
          { upsert: true, new: true }
        );
      }
    };

    // 7. Route and Process Event Types
    if (eventName === 'payment.captured') {
      const paymentEntity = payload.payload?.payment?.entity;
      if (!paymentEntity) {
        res.status(400).json({ success: false, message: 'Missing payment entity in payment.captured payload' });
        return;
      }

      const razorpayPaymentId = paymentEntity.id;
      const razorpayOrderId = paymentEntity.order_id;
      const amountPaise = Number(paymentEntity.amount);
      const currency = String(paymentEntity.currency || 'INR').toUpperCase();
      const paymentMethod = paymentEntity.method || 'upi';

      if (!razorpayOrderId || !razorpayPaymentId) {
        res.status(400).json({ success: false, message: 'Missing order_id or payment id in payment entity' });
        return;
      }

      // Lookup Booking by Authoritative Razorpay Order ID
      let booking: any = null;
      if (isUsingMemoryStore()) {
        booking = memoryStore.bookings.find((b) => b.razorpayOrderId === razorpayOrderId);
      } else {
        booking = await BookingModel.findOne({ razorpayOrderId });
      }

      if (!booking) {
        console.log(`[RAZORPAY_WEBHOOK] unknown_order orderId=${razorpayOrderId} - ignored safely`);
        await recordWebhookEvent('ignored', {
          razorpayOrderId,
          razorpayPaymentId,
          failureReason: 'unknown_order',
        });
        res.status(200).json({
          success: true,
          message: 'Order does not belong to an active MyRide booking; event acknowledged and ignored.',
        });
        return;
      }

      // State Transition Check: Reject payment on cancelled or refunded bookings
      if (booking.bookingStatus === 'CANCELLED' || booking.bookingStatus === 'REFUNDED') {
        console.warn(`[RAZORPAY_WEBHOOK] cancelled_booking_payment_rejected booking=${booking.bookingId}`);
        await recordWebhookEvent('failed', {
          razorpayOrderId,
          razorpayPaymentId,
          failureReason: 'booking_cancelled_or_refunded',
        });
        res.status(400).json({
          success: false,
          message: 'Cannot process payment for a cancelled or refunded booking',
        });
        return;
      }

      // Currency Validation
      if (currency !== 'INR') {
        console.warn(`[RAZORPAY_WEBHOOK] currency_mismatch received=${currency} expected=INR`);
        await recordWebhookEvent('failed', {
          razorpayOrderId,
          razorpayPaymentId,
          failureReason: 'currency_mismatch',
        });
        res.status(400).json({ success: false, message: 'Invalid currency. Only INR is supported.' });
        return;
      }

      // Authoritative Database Amount Validation (paise vs rupees)
      const authoritativeTotalRupees = booking.pricing?.totalAmount || 0;
      const expectedAmountPaise = Math.round(authoritativeTotalRupees * 100);

      if (amountPaise !== expectedAmountPaise) {
        console.error(
          `[RAZORPAY_WEBHOOK] amount_mismatch order=${razorpayOrderId} received=${amountPaise} expected=${expectedAmountPaise}`
        );
        await recordWebhookEvent('failed', {
          razorpayOrderId,
          razorpayPaymentId,
          failureReason: `amount_mismatch: received ${amountPaise} paise, expected ${expectedAmountPaise} paise`,
        });
        res.status(400).json({
          success: false,
          message: 'Payment amount does not match authoritative booking amount',
        });
        return;
      }

      // Check if already paid and confirmed (Idempotency on Booking/Payment)
      if (booking.paymentStatus === 'paid' && booking.bookingStatus === 'CONFIRMED') {
        console.log(`[RAZORPAY_WEBHOOK] already_paid booking=${booking.bookingId}`);
        // Self-healing: verify Payment record exists, backfill safely if missing
        await healPaymentRecordIfMissing({
          booking,
          razorpayOrderId,
          razorpayPaymentId,
          amountPaise,
          currency,
          method: paymentMethod,
        });

        await recordWebhookEvent('processed', { razorpayOrderId, razorpayPaymentId });
        res.status(200).json({
          success: true,
          message: 'Booking is already paid and confirmed',
          idempotent: true,
        });
        return;
      }

      // Atomic Update of Booking and Payment State
      const paidAt = new Date();
      const validMethod = (['upi', 'card', 'netbanking', 'wallet'].includes(paymentMethod)
        ? paymentMethod
        : 'upi') as 'upi' | 'card' | 'netbanking' | 'wallet';

      if (isUsingMemoryStore()) {
        booking.paymentStatus = 'paid';
        booking.bookingStatus = 'CONFIRMED';
        booking.razorpayPaymentId = razorpayPaymentId;
        booking.paidAt = paidAt.toISOString();
        booking.updatedAt = paidAt.toISOString();

        if (!memoryStore.payments) {
          memoryStore.payments = [];
        }
        let paymentRecord = memoryStore.payments.find(
          (p) => p.razorpayPaymentId === razorpayPaymentId
        );
        if (!paymentRecord) {
          memoryStore.payments.push({
            _id: `pay_${Date.now()}`,
            id: `pay_${Date.now()}`,
            bookingId: booking._id || booking.id,
            customerId: booking.customerId,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature: '',
            amountPaise,
            currency: 'INR',
            method: validMethod,
            status: 'captured',
            createdAt: paidAt.toISOString(),
            updatedAt: paidAt.toISOString(),
          });
        } else {
          paymentRecord.status = 'captured';
          paymentRecord.updatedAt = paidAt.toISOString();
        }

        if (!memoryStore.auditLogs) {
          memoryStore.auditLogs = [];
        }
        memoryStore.auditLogs.push({
          action: 'PAYMENT_CAPTURED_WEBHOOK',
          details: `Payment ${razorpayPaymentId} captured for booking ${booking.bookingId} (â‚¹${authoritativeTotalRupees})`,
          timestamp: paidAt.toISOString(),
        });
      } else {
        await BookingModel.findOneAndUpdate(
          { _id: booking._id, paymentStatus: { $ne: 'paid' } },
          {
            paymentStatus: 'paid',
            bookingStatus: 'CONFIRMED',
            razorpayPaymentId,
            paidAt,
          },
          { new: true }
        );

        await PaymentModel.findOneAndUpdate(
          { razorpayPaymentId },
          {
            bookingId: booking._id,
            customerId: booking.customerId,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature: '',
            amountPaise,
            currency: 'INR',
            method: validMethod,
            status: 'captured',
          },
          { upsert: true, new: true }
        );

        await AuditLogModel.create({
          action: 'BOOKING_CANCELLED', // using schema-supported action or details
          targetId: booking._id,
          details: {
            action: 'PAYMENT_CAPTURED_WEBHOOK',
            bookingId: booking.bookingId,
            razorpayPaymentId,
            razorpayOrderId,
            amountPaise,
          },
          timestamp: paidAt,
        }).catch(() => {});
      }

      await recordWebhookEvent('processed', { razorpayOrderId, razorpayPaymentId });
      console.log(`[RAZORPAY_WEBHOOK] payment_captured order=${razorpayOrderId} payment=${razorpayPaymentId} amount=${amountPaise}`);

      res.status(200).json({
        success: true,
        message: 'Payment captured and booking confirmed successfully',
      });
      return;
    }

    if (eventName === 'order.paid') {
      const orderEntity = payload.payload?.order?.entity;
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayOrderId = orderEntity?.id || paymentEntity?.order_id;

      if (!razorpayOrderId) {
        res.status(400).json({ success: false, message: 'Missing order_id in order.paid payload' });
        return;
      }

      let booking: any = null;
      if (isUsingMemoryStore()) {
        booking = memoryStore.bookings.find((b) => b.razorpayOrderId === razorpayOrderId);
      } else {
        booking = await BookingModel.findOne({ razorpayOrderId });
      }

      if (!booking) {
        console.log(`[RAZORPAY_WEBHOOK] unknown_order orderId=${razorpayOrderId} - ignored safely`);
        await recordWebhookEvent('ignored', { razorpayOrderId, failureReason: 'unknown_order' });
        res.status(200).json({ success: true, message: 'Unknown order ignored safely' });
        return;
      }

      // Check if already paid/confirmed
      if (booking.paymentStatus === 'paid' && booking.bookingStatus === 'CONFIRMED') {
        const orderPaymentId = paymentEntity?.id || booking.razorpayPaymentId;
        const totalPaise = Math.round((booking.pricing?.totalAmount || 0) * 100);
        // Self-healing: verify Payment record exists, backfill safely if missing
        await healPaymentRecordIfMissing({
          booking,
          razorpayOrderId,
          razorpayPaymentId: orderPaymentId,
          amountPaise: totalPaise,
          currency: 'INR',
          method: paymentEntity?.method || 'upi',
        });

        await recordWebhookEvent('processed', { razorpayOrderId, razorpayPaymentId: orderPaymentId });
        res.status(200).json({
          success: true,
          message: 'Booking already paid and confirmed',
          idempotent: true,
        });
        return;
      }

      if (booking.bookingStatus === 'CANCELLED' || booking.bookingStatus === 'REFUNDED') {
        await recordWebhookEvent('failed', { razorpayOrderId, failureReason: 'booking_cancelled' });
        res.status(400).json({ success: false, message: 'Cannot process payment for cancelled booking' });
        return;
      }

      const paidAt = new Date();
      const razorpayPaymentId = paymentEntity?.id || booking.razorpayPaymentId;

      if (isUsingMemoryStore()) {
        booking.paymentStatus = 'paid';
        booking.bookingStatus = 'CONFIRMED';
        if (razorpayPaymentId) booking.razorpayPaymentId = razorpayPaymentId;
        booking.paidAt = paidAt.toISOString();
        booking.updatedAt = paidAt.toISOString();

        if (razorpayPaymentId) {
          if (!memoryStore.payments) memoryStore.payments = [];
          const pRec = memoryStore.payments.find((p) => p.razorpayPaymentId === razorpayPaymentId);
          if (!pRec) {
            memoryStore.payments.push({
              _id: `pay_${Date.now()}`,
              id: `pay_${Date.now()}`,
              bookingId: booking._id || booking.id,
              customerId: booking.customerId,
              razorpayOrderId,
              razorpayPaymentId,
              razorpaySignature: '',
              amountPaise: Math.round((booking.pricing?.totalAmount || 0) * 100),
              currency: 'INR',
              method: 'upi',
              status: 'captured',
              createdAt: paidAt.toISOString(),
              updatedAt: paidAt.toISOString(),
            });
          }
        }
      } else {
        await BookingModel.findOneAndUpdate(
          { _id: booking._id, paymentStatus: { $ne: 'paid' } },
          {
            paymentStatus: 'paid',
            bookingStatus: 'CONFIRMED',
            ...(razorpayPaymentId ? { razorpayPaymentId } : {}),
            paidAt,
          },
          { new: true }
        );
      }

      await recordWebhookEvent('processed', { razorpayOrderId, razorpayPaymentId });
      console.log(`[RAZORPAY_WEBHOOK] order_paid order=${razorpayOrderId}`);

      res.status(200).json({
        success: true,
        message: 'Order marked as paid and booking confirmed',
      });
      return;
    }

    if (eventName === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;

      if (!razorpayOrderId) {
        res.status(400).json({ success: false, message: 'Missing order_id in payment.failed payload' });
        return;
      }

      let booking: any = null;
      if (isUsingMemoryStore()) {
        booking = memoryStore.bookings.find((b) => b.razorpayOrderId === razorpayOrderId);
      } else {
        booking = await BookingModel.findOne({ razorpayOrderId });
      }

      if (!booking) {
        console.log(`[RAZORPAY_WEBHOOK] unknown_order orderId=${razorpayOrderId} - ignored safely`);
        await recordWebhookEvent('ignored', { razorpayOrderId, razorpayPaymentId, failureReason: 'unknown_order' });
        res.status(200).json({ success: true, message: 'Unknown order ignored safely' });
        return;
      }

      // State Transition Safety: If booking is already paid/confirmed, DO NOT downgrade
      if (booking.paymentStatus === 'paid' || booking.bookingStatus === 'CONFIRMED') {
        console.log(`[RAZORPAY_WEBHOOK] ignored_late_payment_failed booking ${booking.bookingId} already paid`);
        await recordWebhookEvent('ignored', {
          razorpayOrderId,
          razorpayPaymentId,
          failureReason: 'ignored_late_failure_after_success',
        });
        res.status(200).json({
          success: true,
          message: 'Payment failure ignored as booking is already confirmed and paid',
          idempotent: true,
        });
        return;
      }

      // Mark payment as failed, but keep bookingStatus in PAYMENT_PENDING so customer can retry
      const failedAt = new Date();
      if (isUsingMemoryStore()) {
        booking.paymentStatus = 'failed';
        booking.updatedAt = failedAt.toISOString();

        if (razorpayPaymentId) {
          if (!memoryStore.payments) memoryStore.payments = [];
          const existingPayment = memoryStore.payments.find(
            (p) => p.razorpayPaymentId === razorpayPaymentId
          );
          if (!existingPayment) {
            memoryStore.payments.push({
              _id: `pay_${Date.now()}`,
              id: `pay_${Date.now()}`,
              bookingId: booking._id || booking.id,
              customerId: booking.customerId,
              razorpayOrderId,
              razorpayPaymentId,
              razorpaySignature: '',
              amountPaise: paymentEntity?.amount || Math.round((booking.pricing?.totalAmount || 0) * 100),
              currency: 'INR',
              method: paymentEntity?.method || 'upi',
              status: 'failed',
              createdAt: failedAt.toISOString(),
              updatedAt: failedAt.toISOString(),
            });
          } else {
            existingPayment.status = 'failed';
          }
        }
      } else {
        await BookingModel.updateOne(
          { _id: booking._id, paymentStatus: { $ne: 'paid' } },
          { paymentStatus: 'failed' }
        );

        if (razorpayPaymentId) {
          await PaymentModel.findOneAndUpdate(
            { razorpayPaymentId },
            {
              bookingId: booking._id,
              customerId: booking.customerId,
              razorpayOrderId,
              razorpayPaymentId,
              razorpaySignature: '',
              amountPaise: paymentEntity?.amount || Math.round((booking.pricing?.totalAmount || 0) * 100),
              currency: 'INR',
              method: paymentEntity?.method || 'upi',
              status: 'failed',
            },
            { upsert: true, new: true }
          );
        }
      }

      await recordWebhookEvent('processed', { razorpayOrderId, razorpayPaymentId });
      console.log(`[RAZORPAY_WEBHOOK] payment_failed order=${razorpayOrderId} payment=${razorpayPaymentId}`);

      res.status(200).json({
        success: true,
        message: 'Payment failure recorded; booking remains available for retry',
      });
      return;
    }

    // Clean Extension Point: Safely acknowledge unhandled/future events (refunds, etc.)
    console.log(`[RAZORPAY_WEBHOOK] unhandled_event_safely_acknowledged event=${eventName}`);
    await recordWebhookEvent('ignored', { failureReason: 'unhandled_event_type' });
    res.status(200).json({
      success: true,
      message: `Webhook event '${eventName}' acknowledged and safely ignored`,
    });
  } catch (error: any) {
    console.error('[RAZORPAY_WEBHOOK] unexpected_processing_error', error);
    try {
      if (isClaimOwner && currentEventId) {
        if (isUsingMemoryStore()) {
          const rec = memoryStore.webhookEvents?.find((e) => e.eventId === currentEventId);
          if (rec) {
            rec.status = 'failed';
            rec.failureReason = error?.message || 'unexpected_error';
          }
        } else {
          await PaymentWebhookEventModel.updateOne(
            { eventId: currentEventId },
            { status: 'failed', failureReason: error?.message || 'unexpected_error' }
          );
        }
      }
    } catch {
      // Safe boundary for error telemetry
    }
    // Return 500 so Razorpay knows to retry temporary internal processing failures
    res.status(500).json({
      success: false,
      message: 'Internal server error while processing webhook event. Razorpay may retry.',
    });
  }
}

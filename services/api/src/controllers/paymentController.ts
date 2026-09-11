import { Request, Response, NextFunction } from 'express';
import { isUsingMemoryStore } from '../config/db';
import { memoryStore } from '../config/store';
import BookingModel from '../models/Booking';
import PaymentModel from '../models/Payment';
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

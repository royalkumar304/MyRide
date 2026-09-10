import { Request, Response, NextFunction } from 'express';
import { isUsingMemoryStore } from '../config/db';
import { memoryStore } from '../config/store';
import BookingModel from '../models/Booking';
import PaymentModel from '../models/Payment';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/razorpayService';
import { PaymentVerifySchema } from '@myride/validation';

export async function createPaymentOrder(req: any, res: Response, next: NextFunction) {
  try {
    const { bookingId } = req.body;

    let booking: any = null;
    if (isUsingMemoryStore()) {
      booking = memoryStore.bookings.find((b) => b._id === bookingId || b.bookingId === bookingId);
    } else {
      booking = await BookingModel.findOne({ $or: [{ _id: bookingId }, { bookingId }] });
    }

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    const amountInPaisa = Math.round(booking.pricingBreakdown.totalPayable * 100);
    const razorpayOrder = await createRazorpayOrder({
      amount: amountInPaisa,
      currency: 'INR',
      receipt: booking.bookingId,
      notes: {
        bookingId: booking.bookingId,
        customerId: booking.customerId,
      },
    });

    res.json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_myride123',
        bookingId: booking.bookingId,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyPayment(req: any, res: Response, next: NextFunction) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } =
      PaymentVerifySchema.parse(req.body);

    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      res.status(400).json({ success: false, message: 'Invalid payment signature' });
      return;
    }

    let booking: any = null;
    if (isUsingMemoryStore()) {
      booking = memoryStore.bookings.find((b) => b._id === bookingId || b.bookingId === bookingId);
      if (booking) {
        booking.paymentStatus = 'PAID';
        booking.bookingStatus = 'CONFIRMED';
      }
    } else {
      booking = await BookingModel.findOneAndUpdate(
        { $or: [{ _id: bookingId }, { bookingId }] },
        { paymentStatus: 'PAID', bookingStatus: 'CONFIRMED' },
        { new: true }
      );

      if (booking) {
        await PaymentModel.create({
          bookingId: booking._id,
          customerId: booking.customerId,
          amount: booking.pricingBreakdown.totalPayable,
          currency: 'INR',
          paymentMethod: 'UPI',
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          paymentStatus: 'CAPTURED',
        });
      }
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

export async function simulatePayment(req: any, res: Response, next: NextFunction) {
  try {
    const { bookingId } = req.body;

    let booking: any = null;
    if (isUsingMemoryStore()) {
      booking = memoryStore.bookings.find((b) => b._id === bookingId || b.bookingId === bookingId);
      if (booking) {
        booking.paymentStatus = 'PAID';
        booking.bookingStatus = 'CONFIRMED';
      }
    } else {
      booking = await BookingModel.findOneAndUpdate(
        { $or: [{ _id: bookingId }, { bookingId }] },
        { paymentStatus: 'PAID', bookingStatus: 'CONFIRMED' },
        { new: true }
      );
    }

    res.json({
      success: true,
      message: 'Test payment simulated successfully. Booking confirmed!',
      booking,
    });
  } catch (error) {
    next(error);
  }
}

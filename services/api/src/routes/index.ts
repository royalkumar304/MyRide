import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { getDatabaseStatus } from '../config/db';
import { ENV } from '../config/env';
import * as authController from '../controllers/authController';
import * as vehicleController from '../controllers/vehicleController';
import * as bookingController from '../controllers/bookingController';
import * as paymentController from '../controllers/paymentController';
import * as hostController from '../controllers/hostController';
import * as adminController from '../controllers/adminController';

const router = Router();

// Health Check with Database Status
router.get('/health', (req, res) => {
  const dbStatus = getDatabaseStatus();
  const statusCode = dbStatus.isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: dbStatus.isHealthy ? 'ok' : 'unhealthy',
    database: dbStatus.status,
    environment: ENV.NODE_ENV,
    timestamp: new Date().toISOString(),
    platform: 'MyRide Backend API',
    tagline: 'Apni Ride. Apna Choice.',
    commissionRule: '15% platform commission stored dynamically in database',
  });
});

// Auth Routes
router.post('/auth/send-otp', authController.sendOtp);
router.post('/auth/verify-otp', authController.verifyOtp);
router.post('/auth/signup', authController.signup);
router.get('/auth/me', authenticateToken, authController.getProfile);
router.post('/auth/login-admin', authController.loginAsAdmin);

// Vehicle & Discovery Routes
router.get('/vehicles', vehicleController.listVehicles);
router.get('/vehicles/cities', vehicleController.getSupportedCities);
router.post('/vehicles/quote', vehicleController.calculateFareQuote);
router.get('/vehicles/:id/reviews', bookingController.getVehicleReviews);
router.get('/vehicles/:id', vehicleController.getVehicleById);

// Booking Routes
router.post('/bookings', authenticateToken, bookingController.createBooking);
router.get('/bookings', authenticateToken, bookingController.getBookings);
router.get('/bookings/:id', authenticateToken, bookingController.getBookingById);
router.post('/bookings/:id/cancel', authenticateToken, bookingController.cancelBooking);
router.post('/bookings/:id/handover/start', authenticateToken, bookingController.startHandover);
router.post('/bookings/:id/handover/complete', authenticateToken, bookingController.completeHandover);

// Review Routes
router.post('/reviews', authenticateToken, bookingController.submitReview);

// Payment Routes (Razorpay)
router.post('/payments/create-order', authenticateToken, paymentController.createPaymentOrder);
router.post('/payments/verify', authenticateToken, paymentController.verifyPayment);
// Razorpay Webhook Endpoint (Direct server-to-server, authenticated via HMAC-SHA256 signature, NOT JWT)
router.post('/payments/webhook', paymentController.handleWebhook);

// Host Routes
router.get('/host/dashboard', authenticateToken, hostController.getHostDashboard);
router.get('/host/vehicles', authenticateToken, hostController.getHostVehicles);
router.post('/host/vehicles', authenticateToken, hostController.createHostVehicle);
router.get('/host/earnings', authenticateToken, hostController.getHostEarnings);

// Admin Control Panel Routes
router.get('/admin/stats', authenticateToken, requireRole(['ADMIN']), adminController.getAdminStats);
router.get(
  '/admin/vehicles/pending',
  authenticateToken,
  requireRole(['ADMIN']),
  adminController.getPendingVehicles
);
router.post(
  '/admin/vehicles/:id/approve',
  authenticateToken,
  requireRole(['ADMIN']),
  adminController.approveVehicle
);
router.post(
  '/admin/vehicles/:id/reject',
  authenticateToken,
  requireRole(['ADMIN']),
  adminController.rejectVehicle
);
router.get(
  '/admin/settings',
  authenticateToken,
  requireRole(['ADMIN']),
  adminController.getPlatformSettings
);
router.put(
  '/admin/settings',
  authenticateToken,
  requireRole(['ADMIN']),
  adminController.updatePlatformSettings
);
router.get('/admin/audit-logs', authenticateToken, requireRole(['ADMIN']), adminController.getAuditLogs);

export default router;

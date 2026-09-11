# MYRIDE ("Apni Ride. Apna Choice.")
> India's Local Self-Drive Vehicle Rental Marketplace for Tier-2 and Tier-3 Cities

[![React Native](https://img.shields.io/badge/React%20Native-Expo%20v57-blue.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![Redux Toolkit](https://img.shields.io/badge/Redux-Toolkit-purple.svg)](https://redux-toolkit.js.org/)

---

## 1. Project Overview

**MyRide** is a production-quality Indian self-drive vehicle rental marketplace engineered specifically for Tier-2 and Tier-3 cities in India (e.g., Lucknow, Jaipur, Indore, Bhopal, Kanpur, Patna, Dehradun, Chandigarh, Amritsar, Varanasi, Agra). 

Instead of a generic luxury car rental clone, MyRide delivers a trustworthy, hyper-local, and affordable mobility platform connecting **Customers/Renters** and local **Vehicle Hosts/Owners**.

- **Brand Tagline**: *"Apni Ride. Apna Choice."* / *"Ride Local. Ride Your Way."*
- **Target Audience**: Students, professionals, families, and road-trippers across emerging Indian cities.
- **Business Model**: Transparent 15% platform commission on completed rides (configurable per vehicle category: Bikes: 12%, Cars: 15%, SUVs: 15%, EVs: 10%).

---

## 2. Key Features

### A. Customer Experience
- **City-First Search**: Instant city switcher with popular hubs (Lucknow, Jaipur, Indore, etc.) or GPS detection.
- **Smart Discovery**: Quick category selector (🏍 Bikes, 🚗 Cars, 🚙 SUVs, ⚡ EVs) with map and list view toggles.
- **Comprehensive Filters**: Filter by fuel type (Petrol, Diesel, EV, CNG), transmission (Automatic/Manual), seats, pricing slider, verified hosts, and instant booking.
- **Rich Vehicle Details**: High-resolution image carousel, verified host badge, specs, pickup area, and transparent fare breakdown.
- **4-Step Booking Flow**:
  1. Date & Time selection.
  2. Pickup method (Self-Pickup vs. Doorstep Delivery).
  3. Fare review (Base rental + 15% MyRide fee + GST + 100% refundable security deposit).
  4. Razorpay-ready payment gateway (UPI, Cards, Netbanking, Wallets).
- **Digital Vehicle Handover**: Pre-ride and return photo inspection checklist (odometer reading, fuel gauge, existing scratches, tyre condition, and document verification) to protect customer deposits.
- **Safety Center**: Emergency 112 SOS, 24/7 Roadside Assistance (RSA), and issue reporting.
- **Refer & Earn**: Referral code generation (e.g., `GAURAV200`), shareable links, and ₹200 wallet reward tracking.
- **Localization**: Multi-language support for **English**, **हिंदी (Hindi)**, and **Hinglish** ("Ride Search Karein", "Abhi Book Karein").

### B. Host / Vehicle Owner Experience
- **Host Dashboard**: Real-time earnings summary (Gross earnings, 15% MyRide commission, Net earnings, Available balance).
- **7-Step Add Vehicle Wizard**:
  1. Category Selection (Car, Bike, Scooter, SUV, EV).
  2. Vehicle Specifications (Brand, Model, Year, Plate Number, Fuel, Transmission).
  3. Pricing & Deposits (Daily rate, hourly rate, refundable deposit, delivery fee).
  4. 7-Angle Photo Checklist (Front, Back, Left, Right, Interior, Dashboard, Odometer).
  5. Document Uploads (RC, Commercial/Comprehensive Insurance, PUC).
  6. Operating Hours & Availability.
  7. Preview and Submit for Verification.
- **Host Booking Management**: Manage incoming requests with 1-tap **Accept** / **Reject**, in-app chat, and direct calls.
- **Host Earnings & Payouts**: Visual bar charts (daily, weekly, monthly), 15% commission transparency formula, and IMPS bank payout withdrawal.

---

## 3. Technology Stack

- **Framework**: React Native with Expo SDK 57
- **Language**: TypeScript
- **Navigation**: React Navigation 6 (Native Stack + Bottom Tab Navigators)
- **State Management**: Redux Toolkit + React-Redux
- **Icons**: `@expo/vector-icons` (Ionicons)
- **Backend Architecture**: Node.js + Express.js + MongoDB (Mongoose schemas included in `backend_architecture/models/`)
- **Payments**: Razorpay Architecture
- **Maps**: Google Maps Platform Architecture
- **Push Notifications**: Firebase Cloud Messaging (FCM) Architecture
- **Asset Storage**: Cloudinary Architecture

---

## 4. Installation

Clone or open the repository:

```bash
cd MyRideApp
npm install
```

---

## 5. Environment Variables & Security Isolation

MyRide enforces strict client/server security separation:
- **Mobile Frontend**: Only accesses client-safe public configuration prefixed with `EXPO_PUBLIC_`.
- **Backend API**: Securely holds sensitive secrets (Razorpay Secret, JWT Secret, MongoDB URI, Cloudinary API Secret). **Never** exposed to the mobile app.

### A. Mobile Application (`.env`)
```env
# Central Backend API Endpoint
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1

# Client-Safe Public Keys
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy_YOUR_GOOGLE_MAPS_KEY_HERE
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=myride-assets
EXPO_PUBLIC_CLOUDINARY_PRESET=vehicle_documents
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy_YOUR_FIREBASE_KEY
EXPO_PUBLIC_FIREBASE_PROJECT_ID=myride-mobility
```

### B. Backend API (`services/api/.env`)
```env
# Server & Port
PORT=5000
NODE_ENV=development

# Database & Cache
MONGODB_URI=mongodb://localhost:27017/myride
REDIS_URL=redis://localhost:6379

# Development In-Memory Store (Optional for local testing without MongoDB)
USE_MEMORY_STORE=false

# Authentication Secret (Strictly Backend)
JWT_SECRET=CHANGE_ME_TO_A_LONG_RANDOM_SECRET
JWT_EXPIRES_IN=7d
EXPOSE_DEV_OTP=true

# Payment Secrets (Strictly Backend)
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_PRIVATE_RAZORPAY_SECRET

# Cloud Storage
CLOUDINARY_CLOUD_NAME=myride-assets
CLOUDINARY_API_KEY=YOUR_CLOUDINARY_KEY
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_SECRET
```

> ⚠️ **Security Policy**: In `NODE_ENV=production`, fallback to memory store is strictly prohibited. Production database failure safely halts startup or reports 503 Unhealthy on `/health`.

---

## 6. Local Network & Mobile Setup

When developing locally across emulators, simulators, or physical mobile devices, configure `EXPO_PUBLIC_API_URL` to match your runtime target:

| Target Runtime | `EXPO_PUBLIC_API_URL` | Notes |
| :--- | :--- | :--- |
| **iOS Simulator** | `http://localhost:5000/api/v1` | Shares host loopback |
| **Web Browser** | `http://localhost:5000/api/v1` | Local development |
| **Android Emulator** | `http://10.0.2.2:5000/api/v1` | Android Studio loopback alias |
| **Physical Phone (Expo Go)** | `http://<YOUR_LAN_IP>:5000/api/v1` | Connected to same Wi-Fi |

### Finding Your Local LAN IP:
- **Windows (PowerShell)**:
  ```powershell
  ipconfig | Select-String "IPv4"
  # Example output: 192.168.1.15
  ```
- **macOS / Linux**:
  ```bash
  ifconfig | grep "inet " | grep -v 127.0.0.1
  ```

Update your `.env`:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.15:5000/api/v1
```

### Starting the Stack:
```bash
# 1. Start Backend API (Port 5000)
npm run dev:api

# 2. Start Expo Mobile App
npm start
```

---

## 7. Authentication Flow

MyRide enforces a secure token restoration lifecycle with hardware-backed encryption (`expo-secure-store`). The app **never** assumes authentication is valid simply because a token exists.

```
App Launch
    ↓
Check stored token in SecureStore (expo-secure-store)
    ↓
[No token] ───────────────➔ Display Splash ➔ Route to Login
    ↓
[Token exists]
    ↓
GET /api/v1/auth/me (Backend Verification)
    ↓
[200 OK (Valid Session)] ──➔ Restore Profile ➔ Customer / Host App
    ↓
[401 / Invalid / Expired] ─➔ Clear SecureStore & ApiClient Token ➔ Route to Login
```

- **OTP Verification**: In development, `POST /auth/send-otp` generates SMS logs and optionally includes dev OTP when `EXPOSE_DEV_OTP=true`. In production, OTP values are strictly suppressed from payloads.
- **Hardware-Backed Secure Storage**: Native iOS Keychain and Android Keystore store user JWTs. Plain `AsyncStorage` is never used for authentication tokens on mobile devices.

---

## 8. Available API Endpoints

Base URL: `http://localhost:5000/api/v1` (or `EXPO_PUBLIC_API_URL`)

### System & Health
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Real-time health status: API status (`ok`), MongoDB status (`connected`), environment, and timestamp. |

### Authentication
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/send-otp` | Public | Dispatches 6-digit OTP to Indian mobile number (`+91XXXXXXXXXX`). |
| `POST` | `/auth/verify-otp` | Public | Verifies OTP code and returns authenticated session JWT + user profile. |
| `POST` | `/auth/signup` | Public | Completes new customer or host onboarding and issues JWT. |
| `GET` | `/auth/me` | Bearer JWT | Validates current session token and returns active user profile. |
| `POST` | `/auth/login-admin` | Public | Authenticates admin credentials for control panel. |

### Vehicles & Pricing Engine
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/vehicles` | Public | Lists available vehicles with query filters (`city`, `area`, `vehicleType`, `brand`, `price`, `fuel`, `transmission`, `seats`, `rating`, `distance`, `availability`). |
| `GET` | `/vehicles/cities` | Public | Returns supported tier-2 and tier-3 cities and mobility hubs. |
| `GET` | `/vehicles/:id` | Public | Retrieves detailed vehicle specifications, pricing, host info, and features. |
| `POST` | `/vehicles/quote` | Public | Calculates server-authoritative fare quote (base fare, 15% platform commission, GST taxes, delivery fee, refundable security deposit). |
| `GET` | `/vehicles/:id/reviews` | Public | Retrieves verified customer reviews and ratings for a vehicle. |

### Bookings & Digital Handover
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/bookings` | Bearer JWT | Reserves vehicle, validates slots, computes canonical `booking.pricing`, and issues `bookingId` (e.g. `MYR-123456`). |
| `GET` | `/bookings` | Bearer JWT | Retrieves active, upcoming, and past trips for the authenticated user/host. |
| `GET` | `/bookings/:id` | Bearer JWT | Retrieves single booking details by MongoDB `_id` or canonical `bookingId`. |
| `POST` | `/bookings/:id/cancel` | Bearer JWT | Cancels booking and applies cancellation policy. |
| `POST` | `/bookings/:id/handover/start` | Bearer JWT | Digital Pickup: Records start odometer, fuel level, checklist, and inspection photos. Status ➔ `ACTIVE`. |
| `POST` | `/bookings/:id/handover/complete` | Bearer JWT | Return Handover: Records return odometer, fuel, damage checklist. Status ➔ `COMPLETED` and credits host earnings. |
| `POST` | `/reviews` | Bearer JWT | Submits post-trip star rating and feedback. |

### Payment Gateway (Razorpay)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/payments/create-order` | Bearer JWT | Generates server-side Razorpay order ID in paise matching server `booking.pricing.totalAmount`. |
| `POST` | `/payments/verify` | Bearer JWT | Verifies Razorpay client checkout HMAC-SHA256 signature and confirms booking. |
| `POST` | `/payments/webhook` | Webhook Signature (`X-Razorpay-Signature`) | Server-to-server Razorpay webhook endpoint. Reconciles payment and booking state asynchronously and idempotently without client dependency. |

### Host / Vehicle Owner
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/host/dashboard` | Bearer JWT | Real-time host summary: Gross bookings, 15% commission deductions, net earnings, active fleet. |
| `GET` | `/host/vehicles` | Bearer JWT | Retrieves all vehicles owned by the authenticated host. |
| `POST` | `/host/vehicles` | Bearer JWT | Submits newly listed vehicle to MongoDB with specs, pricing, GeoJSON location, and RC documents. |
| `GET` | `/host/earnings` | Bearer JWT | Visual earnings breakdown, commission statement, and payout history. |

### Admin Control Panel
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/stats` | Admin JWT | Aggregated GMV, total completed bookings, commission revenue. |
| `GET` | `/admin/vehicles/pending` | Admin JWT | Lists vehicle onboarding requests requiring verification. |
| `POST` | `/admin/vehicles/:id/approve` | Admin JWT | Approves vehicle for public search and bookings. |
| `POST` | `/admin/vehicles/:id/reject` | Admin JWT | Rejects vehicle with review notes. |
| `GET` | `/admin/settings` | Admin JWT | Retrieves configurable commission percentages (Cars: 15%, Bikes: 12%, EVs: 10%). |
| `PUT` | `/admin/settings` | Admin JWT | Dynamically updates platform commission and pricing rules. |

---

## 8. Razorpay Integration & Webhook Architecture

MyRide implements a production-grade, two-tier payment lifecycle combining synchronous client verification with asynchronous server-side webhooks.

### A. Primary Client Checkout Lifecycle (Phase 2)
1. **Client requests order**: Mobile app calls `POST /api/v1/payments/create-order` with booking ID.
2. **Server generates authoritative order**: Backend calculates server-authoritative fare in paise (`Math.round(booking.pricing.totalAmount * 100)`), creates genuine order on Razorpay API, and binds `razorpayOrderId` to the booking.
3. **Client opens Razorpay Checkout**: Receives `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`.
4. **Signature verification**: Backend verifies `HMAC-SHA256(order_id + "|" + payment_id, secret)` using `crypto.timingSafeEqual`.
5. **Confirmation**: Booking status transitions to `CONFIRMED` / `upcoming` and payment status to `paid`.

### B. Production-Grade Server-to-Server Webhook Lifecycle (Phase 2.1)
The webhook endpoint (`POST /api/v1/payments/webhook`) ensures authoritative payment reconciliation even if:
- Mobile app crashes or user closes the browser immediately after paying.
- Client network disconnects before checkout callback reaches the backend.
- Razorpay retries webhook delivery due to transient network issues.
- Payments or refunds transition asynchronously.

#### Webhook Endpoint Configuration
- **Production Webhook URL**:
  ```
  https://YOUR_PRODUCTION_API_DOMAIN/api/v1/payments/webhook
  ```
- **Events Configured in Razorpay Dashboard**:
  - `payment.captured` — Captures successful payment, validates authoritative amount/currency, and confirms booking.
  - `payment.failed` — Records failed payment attempt, keeps booking retryable in `PAYMENT_PENDING`, prevents confirmation.
  - `order.paid` — Reconciles booking state when order is marked paid.

#### Webhook Security & Signature Verification
- **Dedicated Environment Variable**: `RAZORPAY_WEBHOOK_SECRET=CHANGE_ME_TO_A_RANDOM_WEBHOOK_SECRET`
  > ⚠️ The exact same secret configured in the Razorpay Dashboard must be configured in the backend environment. Do NOT reuse `RAZORPAY_KEY_SECRET`. Webhook secrets must never be exposed to frontend/mobile bundles.
- **Cryptographic Signature Verification**:
  - Webhooks do NOT use JWT authentication.
  - Header: `X-Razorpay-Signature`
  - Input: **EXACT RAW HTTP Request Body** (`express.raw({ type: '*/*' })` applied strictly to webhook route)
  - Verification: `crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex')`
  - Comparison: `crypto.timingSafeEqual()` to defend against timing attacks.
  - Missing/invalid signatures immediately return `HTTP 400 Bad Request`.

#### Financial Safety & Idempotency
- **Durable Idempotency Store**: `PaymentWebhookEvent` collection indexed uniquely on `eventId`. Duplicate webhooks return `200 OK` with `idempotent: true` without creating duplicate payments or re-confirming bookings.
- **Authoritative Database Validation**: The payment amount from Razorpay (in paise) is strictly validated against the server-authoritative database booking total (`Math.round(booking.pricing.totalAmount * 100)`). Any amount or currency mismatch is rejected with `HTTP 400` and logged as a security alert.
- **State Machine Safeguards**:
  - Cancelled bookings cannot be marked paid.
  - Confirmed/paid bookings are never downgraded by late `payment.failed` webhooks.
  - Out-of-order events resolve safely without financial state corruption.

#### Local Development & Webhook Forwarding Workflow
To test Razorpay webhooks locally against `http://localhost:5000`:
1. Start a local tunnel using your preferred tunneling tool:
   ```bash
   # Option A: ngrok
   ngrok http 5000

   # Option B: localtunnel
   npx localtunnel --port 5000
   ```
2. In Razorpay Test Dashboard -> Settings -> Webhooks -> Add New Webhook:
   - **Webhook URL**: `https://<YOUR_TUNNEL_SUBDOMAIN>/api/v1/payments/webhook`
   - **Secret**: Set a random secret string (e.g. `whsec_dev_local_test_1234`)
   - **Active Events**: Select `payment.captured`, `payment.failed`, and `order.paid`
3. Add the secret to your local `services/api/.env`:
   ```env
   RAZORPAY_WEBHOOK_SECRET=whsec_dev_local_test_1234
   ```
4. Run automated test suite:
   ```bash
   cd services/api
   npm test
   ```

---

## 9. Google Maps Integration

For production navigation and address geocoding:
- Uses `react-native-maps` with Google Maps SDK for Android & iOS.
- Vehicle schemas store GeoJSON coordinates `[longitude, latitude]` for 2dsphere indexing.
- Search queries query vehicles within radial distances:
  ```javascript
  Vehicle.find({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: 15000 // 15 km radius
      }
    }
  });
  ```

---

## 10. Firebase Push Notifications

FCM notification architecture is structured for the following lifecycle events:
- Booking confirmed: *"Your booking for Hyundai i20 is confirmed 🎉"*
- Trip start reminder: *"Your ride starts in 2 hours. Keep your driving license ready."*
- Host notification: *"New booking request from Gaurav Mishra."*
- Payout confirmation: *"₹1,700 added to your host earnings."*

---

## 11. Production Build Instructions

### Android APK / AAB
Using EAS (Expo Application Services):
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile production
```

### iOS IPA
```bash
eas build --platform ios --profile production
```

---

## 12. License & Attribution

Copyright © 2026 MyRide Mobility India Pvt. Ltd. All rights reserved.
Built for the Bharat Mobility Revolution.

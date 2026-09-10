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

## 5. Environment Variables

Create a `.env` file in the project root based on the provided template:

```env
# API & Backend
API_BASE_URL=https://api.myride.in/v1

# Google Maps Platform
GOOGLE_MAPS_API_KEY=AIzaSy_YOUR_GOOGLE_MAPS_KEY_HERE

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_SECRET

# Firebase Cloud Messaging
FIREBASE_API_KEY=AIzaSy_YOUR_FIREBASE_KEY
FIREBASE_PROJECT_ID=myride-mobility
FIREBASE_MESSAGING_SENDER_ID=1092837465
FIREBASE_APP_ID=1:1092837465:web:abcdef123456

# Cloudinary Document & Image Storage
CLOUDINARY_CLOUD_NAME=myride-assets
CLOUDINARY_PRESET=vehicle_documents
```

> **Security Note**: Never commit actual API keys or secrets to version control.

---

## 6. Running Locally

### Start Expo Development Server

```bash
npx expo start
```

### Running on Targets
- **Android**: Press `a` in terminal or run `npm run android`
- **iOS**: Press `i` in terminal or run `npm run ios` (macOS required)
- **Web Browser**: Press `w` in terminal or run `npm run web`
- **Physical Device**: Scan the QR code using the **Expo Go** app on Android or Camera app on iOS.

---

## 7. Backend Integration Architecture

The mobile app includes a clean, decoupled service layer in `src/services/`:
- `authService.ts` -> `/auth/send-otp`, `/auth/verify-otp`, `/auth/signup`
- `vehicleService.ts` -> `/vehicles`, `/vehicles/:id`, `/vehicles/host`
- `bookingService.ts` -> `/bookings`, `/bookings/:id/cancel`, `/bookings/:id/inspection`
- `paymentService.ts` -> `/payments/create-order`, `/payments/verify`
- `hostService.ts` -> `/host/dashboard`, `/host/payout`

To connect to a live Node.js/Express backend, replace `mockApiCall` with standard `fetch` or `axios` instances using `getAuthToken()` for `Bearer JWT` headers.

MongoDB schemas are fully defined in:
`backend_architecture/models/index.ts`

---

## 8. Razorpay Integration Architecture

The 4th step of the booking flow connects to Razorpay via order creation and signature verification:

1. **Client requests order**: App calls `POST /payments/create-order` with booking amount in INR.
2. **Server generates order**: Node.js backend uses Razorpay SDK:
   ```javascript
   const order = await razorpay.orders.create({
     amount: amountInPaise,
     currency: 'INR',
     receipt: `receipt_${bookingId}`,
   });
   ```
3. **Client opens Razorpay Checkout**: Receives `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`.
4. **Signature verification**: Backend verifies `HmacSHA256(order_id + "|" + payment_id, secret)`.
5. **Confirmation**: Booking status transitions to `upcoming` and security deposit is recorded.

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

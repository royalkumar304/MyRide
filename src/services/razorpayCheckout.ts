import { Platform } from 'react-native';

export interface RazorpayCheckoutOptions {
  keyId: string;
  orderId: string;
  amount: number; // in paise (e.g., 250000 for ₹2,500.00)
  currency: string;
  name: string;
  description: string;
  prefill?: {
    name?: string;
    contact?: string;
    email?: string;
  };
  themeColor?: string;
}

export interface RazorpayCheckoutSuccessResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutErrorResult {
  code:
    | 'CANCELLED'
    | 'FAILED'
    | 'EXPIRED'
    | 'NETWORK_ERROR'
    | 'CONFIG_MISSING'
    | 'NATIVE_MODULE_UNAVAILABLE';
  message: string;
  details?: any;
}

export type RazorpayCheckoutResponse =
  | { success: true; data: RazorpayCheckoutSuccessResult }
  | { success: false; error: RazorpayCheckoutErrorResult };

/**
 * Loads official Razorpay Web Checkout script dynamically for Web platform
 */
function loadRazorpayWebScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Opens Razorpay Standard Checkout in a Web browser
 */
async function openWebRazorpayCheckout(
  options: RazorpayCheckoutOptions
): Promise<RazorpayCheckoutResponse> {
  const isLoaded = await loadRazorpayWebScript();
  if (!isLoaded || !(window as any).Razorpay) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Unable to load Razorpay checkout library from Razorpay servers. Please check your internet connection.',
      },
    };
  }

  return new Promise((resolve) => {
    let hasResolved = false;

    const rzpOptions = {
      key: options.keyId,
      amount: options.amount,
      currency: options.currency || 'INR',
      name: options.name || 'MyRide',
      description: options.description || 'Vehicle Rental Booking',
      order_id: options.orderId,
      prefill: {
        name: options.prefill?.name || '',
        contact: options.prefill?.contact || '',
        email: options.prefill?.email || '',
      },
      theme: {
        color: options.themeColor || '#2563EB',
      },
      handler: function (response: any) {
        if (!hasResolved) {
          hasResolved = true;
          resolve({
            success: true,
            data: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
          });
        }
      },
      modal: {
        ondismiss: function () {
          if (!hasResolved) {
            hasResolved = true;
            resolve({
              success: false,
              error: {
                code: 'CANCELLED',
                message: 'Payment was cancelled. You can retry paying for this booking anytime.',
              },
            });
          }
        },
      },
    };

    try {
      const rzp = new (window as any).Razorpay(rzpOptions);
      rzp.on('payment.failed', function (resp: any) {
        if (!hasResolved) {
          hasResolved = true;
          resolve({
            success: false,
            error: {
              code: 'FAILED',
              message:
                resp?.error?.description ||
                resp?.error?.reason ||
                'Payment transaction failed at Razorpay banking gateway.',
              details: resp?.error,
            },
          });
        }
      });
      rzp.open();
    } catch (err: any) {
      if (!hasResolved) {
        hasResolved = true;
        resolve({
          success: false,
          error: {
            code: 'FAILED',
            message: err.message || 'Failed to initialize Razorpay checkout',
            details: err,
          },
        });
      }
    }
  });
}

/**
 * Initiates Razorpay Checkout across platforms.
 * In Native environments, tries native RazorpayCheckout module.
 * If running in Expo Go where native module is unlinked, clearly reports that a Development Build
 * is required without simulating fake payments.
 */
export async function openRazorpayCheckout(
  options: RazorpayCheckoutOptions
): Promise<RazorpayCheckoutResponse> {
  if (!options.keyId || !options.orderId) {
    return {
      success: false,
      error: {
        code: 'CONFIG_MISSING',
        message: 'Razorpay Key ID or Order ID is missing from server response. Payment cannot proceed.',
      },
    };
  }

  // Web platform execution
  if (Platform.OS === 'web') {
    return openWebRazorpayCheckout(options);
  }

  // Native iOS / Android execution
  try {
    // Dynamic import to prevent crash when native package is not linked in Expo Go
    let RazorpayCheckout: any = null;
    try {
      // @ts-ignore
      const nativeModule = require('react-native-razorpay');
      RazorpayCheckout = nativeModule.default || nativeModule;
    } catch {
      RazorpayCheckout = null;
    }

    if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
      // Native module is not available in standard Expo Go client.
      // Must NOT simulate fake success. Report clearly to the user.
      return {
        success: false,
        error: {
          code: 'NATIVE_MODULE_UNAVAILABLE',
          message:
            'Native Razorpay Checkout requires a Development Build (npx expo run:android / expo run:ios). In standard Expo Go, third-party native code is not bundled.',
        },
      };
    }

    const nativeOptions = {
      description: options.description || 'Vehicle Rental Booking',
      currency: options.currency || 'INR',
      key: options.keyId,
      amount: options.amount,
      name: options.name || 'MyRide',
      order_id: options.orderId,
      prefill: {
        email: options.prefill?.email || '',
        contact: options.prefill?.contact || '',
        name: options.prefill?.name || '',
      },
      theme: { color: options.themeColor || '#2563EB' },
    };

    const nativeResult = await RazorpayCheckout.open(nativeOptions);

    if (
      nativeResult &&
      nativeResult.razorpay_payment_id &&
      nativeResult.razorpay_order_id &&
      nativeResult.razorpay_signature
    ) {
      return {
        success: true,
        data: {
          razorpay_order_id: nativeResult.razorpay_order_id,
          razorpay_payment_id: nativeResult.razorpay_payment_id,
          razorpay_signature: nativeResult.razorpay_signature,
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'FAILED',
        message: 'Incomplete payment response returned from Razorpay SDK',
        details: nativeResult,
      },
    };
  } catch (error: any) {
    // Check Razorpay standard error codes
    const code = error?.code;
    const description = error?.description || error?.message || 'Payment cancelled or failed';

    if (code === 0 || description.toLowerCase().includes('cancel')) {
      return {
        success: false,
        error: {
          code: 'CANCELLED',
          message: 'Payment was cancelled by the customer. Your booking remains reserved in PAYMENT_PENDING.',
          details: error,
        },
      };
    }

    if (code === 2 || description.toLowerCase().includes('network')) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error encountered during payment. Please verify your connection and retry.',
          details: error,
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'FAILED',
        message: description,
        details: error,
      },
    };
  }
}

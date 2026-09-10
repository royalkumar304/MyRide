interface OtpEntry {
  otp: string;
  expiresAt: number;
}

// In-memory OTP storage mapped by 10-digit mobile number
const otpStore = new Map<string, OtpEntry>();

export const smsService = {
  /**
   * Generates a 4-digit OTP and sends via Fast2SMS / Twilio or local simulator
   */
  async sendOtp(rawPhone: string): Promise<{ otp: string; provider: string; sent: boolean; message: string }> {
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
    // Generate a 4-digit random code
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    otpStore.set(cleanPhone, { otp, expiresAt });
    console.log(`[SMS Service] Generated OTP for +91${cleanPhone}: ${otp} (Valid for 5 mins)`);

    // 1. Fast2SMS Provider (India)
    const fast2smsKey = process.env.FAST2SMS_API_KEY;
    if (fast2smsKey) {
      try {
        const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            'authorization': fast2smsKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            variables_values: otp,
            route: 'otp',
            numbers: cleanPhone,
          }),
        });
        const result: any = await response.json();
        console.log(`[SMS Service] Fast2SMS Response:`, result);
        if (result && result.return) {
          return { otp, provider: 'Fast2SMS', sent: true, message: `OTP sent via SMS to +91 ${cleanPhone}` };
        }
      } catch (err) {
        console.error(`[SMS Service] Fast2SMS Error:`, err);
      }
    }

    // 2. Twilio Provider
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
      try {
        const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        const body = new URLSearchParams({
          From: TWILIO_PHONE_NUMBER,
          To: `+91${cleanPhone}`,
          Body: `Your MyRide verification code is: ${otp}. Valid for 5 minutes. Do not share with anyone.`,
        });

        const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        });
        const result: any = await response.json();
        console.log(`[SMS Service] Twilio Response:`, result);
        return { otp, provider: 'Twilio', sent: true, message: `OTP sent via Twilio to +91 ${cleanPhone}` };
      } catch (err) {
        console.error(`[SMS Service] Twilio Error:`, err);
      }
    }

    // 3. Development / Simulator Mode
    return {
      otp,
      provider: 'Simulator',
      sent: false,
      message: `OTP generated for +91 ${cleanPhone}. Use code: ${otp} (or demo 1234)`,
    };
  },

  /**
   * Verifies the OTP submitted by the user
   */
  verifyOtp(rawPhone: string, submittedOtp: string): { valid: boolean; reason?: string } {
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);

    // Universal fallback codes for instant dev/QA testing
    if (submittedOtp === '1234' || submittedOtp === '123456') {
      return { valid: true };
    }

    const entry = otpStore.get(cleanPhone);
    if (!entry) {
      return { valid: false, reason: 'No OTP requested for this mobile number or OTP has expired' };
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(cleanPhone);
      return { valid: false, reason: 'OTP has expired. Please tap Resend Code.' };
    }

    if (entry.otp !== submittedOtp) {
      return { valid: false, reason: 'Incorrect OTP. Please enter the code sent to your number.' };
    }

    // Success: consume OTP
    otpStore.delete(cleanPhone);
    return { valid: true };
  },
};

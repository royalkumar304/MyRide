import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { isUsingMemoryStore } from '../config/db';
import { memoryStore } from '../config/store';
import UserModel from '../models/User';
import { AuthPhoneSchema, VerifyOtpSchema, UserSignupSchema } from '@myride/validation';

import { smsService } from '../services/smsService';

export async function sendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone } = AuthPhoneSchema.parse(req.body);
    const smsResult = await smsService.sendOtp(phone);

    res.json({
      success: true,
      message: smsResult.message,
      provider: smsResult.provider,
      sentViaSms: smsResult.sent,
      otp: smsResult.otp,
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, otp } = VerifyOtpSchema.parse(req.body);

    const verification = smsService.verifyOtp(phone, otp);
    if (!verification.valid) {
      res.status(400).json({ success: false, message: verification.reason || 'Invalid OTP. Please check your SMS and try again.' });
      return;
    }

    let user: any = null;
    if (isUsingMemoryStore()) {
      user = memoryStore.users.find((u) => u.phone === phone);
    } else {
      user = await UserModel.findOne({ phone });
    }

    if (!user) {
      res.json({
        success: true,
        requiresSignup: true,
        message: 'Phone verified. Please complete your profile.',
        phone,
      });
      return;
    }

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role, phone: user.phone },
      ENV.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        city: user.city,
        kycStatus: user.kycStatus,
        walletBalance: user.walletBalance,
        referralCode: user.referralCode,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const data = UserSignupSchema.parse(req.body);
    const referralCode = `MYR${data.phone.slice(-4)}${Math.floor(10 + Math.random() * 90)}`;

    let user: any = null;
    if (isUsingMemoryStore()) {
      const existing = memoryStore.users.find((u) => u.phone === data.phone);
      if (existing) {
        res.status(400).json({ success: false, message: 'User already exists with this phone' });
        return;
      }
      user = {
        _id: `user_${Date.now()}`,
        name: data.name,
        phone: data.phone,
        email: data.email,
        role: data.role || 'CUSTOMER',
        city: data.city,
        kycStatus: 'PENDING',
        walletBalance: 100, // ₹100 welcome bonus for Tier-2/3 audience!
        referralCode,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.users.push(user);
    } else {
      const existing = await UserModel.findOne({ phone: data.phone });
      if (existing) {
        res.status(400).json({ success: false, message: 'User already exists with this phone' });
        return;
      }
      user = await UserModel.create({
        ...data,
        walletBalance: 100,
        referralCode,
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role, phone: user.phone },
      ENV.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        city: user.city,
        kycStatus: user.kycStatus,
        walletBalance: user.walletBalance,
        referralCode: user.referralCode,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    let user: any = null;

    if (isUsingMemoryStore()) {
      user = memoryStore.users.find((u) => u._id.toString() === userId?.toString());
    } else {
      user = await UserModel.findById(userId).select('-password');
    }

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        city: user.city,
        kycStatus: user.kycStatus,
        walletBalance: user.walletBalance,
        referralCode: user.referralCode,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function loginAsAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    // Fast admin sign-in for development & evaluation
    if (email === 'admin@myride.in' && (password === 'admin123' || !password)) {
      const adminUser = memoryStore.users.find((u) => u.role === 'ADMIN');
      const token = jwt.sign(
        { userId: adminUser?._id || 'admin_1', role: 'ADMIN', phone: '9999999999' },
        ENV.JWT_SECRET,
        { expiresIn: '7d' }
      );
      res.json({
        success: true,
        token,
        user: {
          id: adminUser?._id || 'admin_1',
          name: 'MyRide Admin',
          email: 'admin@myride.in',
          role: 'ADMIN',
        },
      });
      return;
    }

    res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  } catch (error) {
    next(error);
  }
}

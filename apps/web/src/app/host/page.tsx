'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Car,
  TrendingUp,
  Percent,
  ShieldCheck,
  CheckCircle,
  FileText,
  DollarSign,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function HostPortal() {
  const [vehicleType, setVehicleType] = useState<'car' | 'bike' | 'suv'>('car');
  const [dailyRate, setDailyRate] = useState<number>(2000);
  const [daysPerMonth, setDaysPerMonth] = useState<number>(18);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '2023',
    registrationNumber: '',
    city: 'Lucknow',
    dailyRate: '1999',
    securityDeposit: '2000',
    fuelType: 'Petrol',
    transmission: 'Manual',
  });

  // Calculate earnings based on standard 15% commission
  const commissionRate = vehicleType === 'bike' ? 12 : 15;
  const grossMonthly = dailyRate * daysPerMonth;
  const platformFee = Math.round((grossMonthly * commissionRate) / 100);
  const netMonthlyPayout = grossMonthly - platformFee;

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" /> MyRide Host Network
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Turn Your Idle Car or Bike Into Steady Monthly Income
        </h1>
        <p className="text-base sm:text-lg text-slate-600">
          List your vehicle in Lucknow, Jaipur, or Indore. Keep <strong className="text-orange-600">85% of every rental</strong> with our transparent 15% platform commission.
        </p>
      </div>

      {/* Interactive 15% Earnings Calculator */}
      <div className="bg-gradient-to-br from-slate-900 to-[#10192e] rounded-3xl p-8 sm:p-12 text-white border border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Host Earnings Calculator</h2>
            <p className="text-xs text-slate-400 mt-1">See your estimated take-home earnings after our 15% platform fee.</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">
            Flat 15% Commission Guarantee
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Controls */}
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Vehicle Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'car', label: '🚗 Car', rate: 2000 },
                  { id: 'bike', label: '🏍️ Bike', rate: 900 },
                  { id: 'suv', label: '🚙 SUV', rate: 3200 },
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setVehicleType(v.id as any);
                      setDailyRate(v.rate);
                    }}
                    className={`p-3 rounded-2xl text-xs font-bold transition text-center ${
                      vehicleType === v.id
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Daily Rental Price</span>
                <span className="font-extrabold text-white">₹{dailyRate} /day</span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={dailyRate}
                onChange={(e) => setDailyRate(Number(e.target.value))}
                className="w-full accent-orange-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Days Rented Per Month</span>
                <span className="font-extrabold text-white">{daysPerMonth} Days</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={daysPerMonth}
                onChange={(e) => setDaysPerMonth(Number(e.target.value))}
                className="w-full accent-orange-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Breakdown Card */}
          <div className="p-8 rounded-3xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between space-y-6">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Estimated Net Monthly Payout</div>
              <div className="text-4xl sm:text-5xl font-black text-emerald-400 mt-2">
                ₹{netMonthlyPayout.toLocaleString('en-IN')}
                <span className="text-sm font-normal text-slate-400"> /month</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Transferred directly to your bank account weekly.</p>
            </div>

            <div className="space-y-2 text-xs border-t border-slate-700 pt-4 text-slate-300">
              <div className="flex justify-between">
                <span>Gross Rental Fare ({daysPerMonth} days × ₹{dailyRate})</span>
                <span className="font-bold text-white">₹{grossMonthly.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-orange-400">
                <span>MyRide Platform Commission ({commissionRate}%)</span>
                <span className="font-bold">-₹{platformFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold pt-2 border-t border-slate-700">
                <span>You Keep (85% - 88%)</span>
                <span>₹{netMonthlyPayout.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Step Listing Wizard */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-8">
        <div>
          <span className="text-xs font-bold uppercase text-orange-600 tracking-wider">Fast-Track Listing</span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">Register Your Vehicle on MyRide</h2>
          <p className="text-xs text-slate-500">Step {step} of 4 • Admin verification takes under 4 hours</p>
        </div>

        {submitted ? (
          <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-emerald-900">Vehicle Submitted Successfully!</h3>
            <p className="text-xs text-emerald-700 max-w-md mx-auto">
              Our city team will verify your RC & insurance in Lucknow. You will receive an SMS confirmation once approved!
            </p>
            <Link
              href="/search"
              className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition"
            >
              Back to Fleet
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800">1. Vehicle Specification</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Make / Brand</label>
                    <input
                      type="text"
                      placeholder="e.g. Hyundai, Tata, Royal Enfield"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Model</label>
                    <input
                      type="text"
                      placeholder="e.g. Creta, Swift, Classic 350"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800">2. Registration & City Hub</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Registration Plate Number</label>
                    <input
                      type="text"
                      placeholder="e.g. UP32 AB 1234"
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Pickup City</label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium"
                    >
                      <option value="Lucknow">Lucknow (UP)</option>
                      <option value="Jaipur">Jaipur (RJ)</option>
                      <option value="Indore">Indore (MP)</option>
                      <option value="Bhopal">Bhopal (MP)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800">3. Set Your Daily Rental Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Daily Rate (₹)</label>
                    <input
                      type="number"
                      value={formData.dailyRate}
                      onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Security Deposit (₹)</label>
                    <input
                      type="number"
                      value={formData.securityDeposit}
                      onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium"
                    />
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-orange-50 text-orange-800 text-xs">
                  💡 With ₹{formData.dailyRate}/day and our 15% platform commission, you earn ₹{Math.round(Number(formData.dailyRate) * 0.85)} net per day directly in your bank account!
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800">4. Document & Photo Verification</h3>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-500">
                  <FileText className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">RC & Commercial Insurance Attached</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">DigiLocker / mParivahan verification enabled</p>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-100">
              {step > 1 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Back
                </button>
              ) : <div></div>}

              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/25 transition"
              >
                {step === 4 ? 'Submit for Approval' : 'Continue'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

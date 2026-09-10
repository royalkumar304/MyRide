'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Car,
  ShieldCheck,
  MapPin,
  Calendar,
  CheckCircle,
  Star,
  Fuel,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Percent,
  Compass,
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

export default function HomePage() {
  const [selectedCity, setSelectedCity] = useState('Lucknow');
  const [selectedType, setSelectedType] = useState('ALL');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quote breakdown modal
  const [activeQuoteVehicle, setActiveQuoteVehicle] = useState<any>(null);
  const [quoteData, setQuoteData] = useState<any>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  useEffect(() => {
    async function fetchVehicles() {
      try {
        const res = await fetch(`${API_BASE}/vehicles`);
        if (res.ok) {
          const data = await res.json();
          setVehicles(data.vehicles || []);
        }
      } catch (err) {
        console.warn('Backend API connection check:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchVehicles();
  }, []);

  const openQuoteModal = async (vehicle: any) => {
    setActiveQuoteVehicle(vehicle);
    setQuoteLoading(true);
    try {
      const res = await fetch(`${API_BASE}/vehicles/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehicle._id,
          startDateTime: new Date().toISOString(),
          endDateTime: new Date(Date.now() + 86400000 * 2).toISOString(),
          pickupType: 'self_pickup',
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setQuoteData(d.breakdown);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setQuoteLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (selectedCity && v.location?.city?.toLowerCase() !== selectedCity.toLowerCase()) {
      return false;
    }
    if (selectedType !== 'ALL' && v.type?.toUpperCase() !== selectedType) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="hero-pattern relative text-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> India's Self-Drive Mobility Revolution
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-none text-white">
              Apni Ride. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400">
                Apna Choice.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed">
              Rent self-drive cars, bikes, and EVs directly from verified local hosts in{' '}
              <strong className="text-white">Lucknow, Jaipur, Indore, Bhopal</strong> and beyond. Zero hidden surcharges. 100% transparent.
            </p>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800 max-w-lg">
              <div>
                <div className="text-2xl font-black text-orange-400">₹899</div>
                <div className="text-xs text-slate-400">Bikes starting at / day</div>
              </div>
              <div>
                <div className="text-2xl font-black text-white">15%</div>
                <div className="text-xs text-slate-400">Flat platform fee (No surge)</div>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-400">100%</div>
                <div className="text-xs text-slate-400">Refundable security deposit</div>
              </div>
            </div>
          </div>

          {/* Search & Booking Engine Widget */}
          <div className="mt-12 bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-slate-900 max-w-5xl">
            <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              {['ALL', 'CAR', 'BIKE', 'EV', 'SUV'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    selectedType === t
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t === 'ALL' ? 'All Vehicles' : t === 'CAR' ? '🚗 Cars' : t === 'BIKE' ? '🏍️ Bikes' : t === 'EV' ? '⚡ EVs' : '🚙 SUVs'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Pickup City
                </label>
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Lucknow">Lucknow (UP)</option>
                    <option value="Jaipur">Jaipur (RJ)</option>
                    <option value="Indore">Indore (MP)</option>
                    <option value="Bhopal">Bhopal (MP)</option>
                    <option value="Patna">Patna (BR)</option>
                    <option value="Kanpur">Kanpur (UP)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Pickup Date
                </label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-medium text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Return Date
                </label>
                <input
                  type="date"
                  defaultValue={new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-medium text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-end">
                <Link
                  href={`/search?city=${selectedCity}&type=${selectedType}`}
                  className="w-full py-3.5 px-6 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-center text-sm shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2"
                >
                  <Compass className="w-4 h-4" /> Find My Ride
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Vehicles Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-bold uppercase text-orange-600 tracking-wider mb-1">
              Live Fleet in {selectedCity}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Verified Self-Drive Vehicles
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Hand-picked, RC verified, and sanitised vehicles ready for immediate booking.
            </p>
          </div>

          <Link
            href="/search"
            className="text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 self-start sm:self-auto"
          >
            View All Vehicles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Connecting to MyRide Backend...
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8">
            <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No vehicles matching in {selectedCity}</h3>
            <p className="text-xs text-slate-500 mt-1">Try switching to Lucknow or Jaipur to see active fleets.</p>
            <button
              onClick={() => setSelectedCity('Lucknow')}
              className="mt-4 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold shadow"
            >
              Switch to Lucknow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle._id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden bg-slate-100">
                    <img
                      src={vehicle.images?.[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800'}
                      alt={vehicle.model}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {vehicle.rating || 4.9} ({vehicle.totalTrips || 12} trips)
                    </div>

                    <div className="absolute top-3 right-3 bg-emerald-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-4">
                    <div>
                      <div className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
                        {vehicle.type} • {vehicle.fuelType} • {vehicle.transmission}
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {vehicle.location?.address || vehicle.location?.city}
                      </div>
                    </div>

                    {/* Features Tags */}
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      {vehicle.features?.slice(0, 3).map((f: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-medium">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pricing & Footer */}
                <div className="p-6 pt-0 border-t border-slate-100 mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Daily Rate</span>
                    <div className="text-xl font-black text-slate-900">
                      ₹{vehicle.pricing?.dailyRate}
                      <span className="text-xs font-normal text-slate-500"> /day</span>
                    </div>
                  </div>

                  <button
                    onClick={() => openQuoteModal(vehicle)}
                    className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition flex items-center gap-1.5"
                  >
                    View Fare Breakdown
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Transparent Commission Comparison Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 to-[#0d1527] rounded-3xl p-8 sm:p-12 text-white border border-slate-800 relative overflow-hidden">
          <div className="max-w-3xl relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
              <Percent className="w-3.5 h-3.5" /> Fair Marketplace Economics
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Why MyRide is 25%–40% Cheaper than Traditional Rental Apps
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Old rental platforms take up to <strong className="text-white">40% commissions</strong> from vehicle owners, forcing them to charge excessive daily rates.
              At MyRide, our server-side pricing engine applies a <strong className="text-orange-400">fair 15% platform fee</strong>.
              Vehicle hosts take home 85% of their gross earnings, and customers enjoy unbeatable local rates.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="text-xs font-bold text-rose-400 uppercase mb-1">Traditional Rental Apps</div>
                <div className="text-xl font-bold text-white mb-2">35% - 45% Hidden Cut</div>
                <ul className="text-xs text-slate-400 space-y-1.5">
                  <li>❌ Surge pricing during weekends</li>
                  <li>❌ Host gets barely 55% of the trip fare</li>
                  <li>❌ High damage deductions</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-orange-500/10 border border-orange-500/30">
                <div className="text-xs font-bold text-orange-400 uppercase mb-1">MyRide Transparent Model</div>
                <div className="text-xl font-bold text-white mb-2">15% Configurable Commission</div>
                <ul className="text-xs text-slate-300 space-y-1.5">
                  <li>✅ Host takes home 85% net direct to bank</li>
                  <li>✅ 100% refundable security deposit</li>
                  <li>✅ Full server-side receipt with line-by-line GST</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Become a Host CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-orange-500 rounded-3xl p-8 sm:p-12 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-8 shadow-xl shadow-orange-500/20">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-white/20">
              Host Community
            </span>
            <h2 className="text-3xl sm:text-4xl font-black">
              Own a Car or Bike in Lucknow or Jaipur? Turn Idle Wheels into Cash.
            </h2>
            <p className="text-sm sm:text-base text-orange-100">
              Earn between ₹25,000 to ₹55,000 every month. Our 15% platform commission guarantees you retain 85% of every rental rupee.
            </p>
          </div>

          <Link
            href="/host"
            className="px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-orange-600 font-extrabold text-sm shadow-xl transition self-start lg:self-center"
          >
            Calculate Host Earnings ↗
          </Link>
        </div>
      </section>

      {/* Real-time Pricing Breakdown Modal */}
      {activeQuoteVehicle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase text-orange-600">Official Server Quote</span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                  {activeQuoteVehicle.brand} {activeQuoteVehicle.model}
                </h3>
                <p className="text-xs text-slate-500">{activeQuoteVehicle.registrationNumber} • 2 Days Rental</p>
              </div>
              <button
                onClick={() => setActiveQuoteVehicle(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {quoteLoading ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Computing dynamic quotation from backend pricing engine...
              </div>
            ) : quoteData ? (
              <div className="space-y-4">
                {/* Visual Commission Callout */}
                <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-orange-700">Platform Commission ({quoteData.commissionRate}%)</div>
                    <div className="text-[11px] text-orange-600">Stored dynamically in Central DB</div>
                  </div>
                  <div className="text-base font-black text-orange-700">₹{quoteData.commissionAmount}</div>
                </div>

                {/* Line Items */}
                <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span>Base Vehicle Rental (2 Days)</span>
                    <span className="font-semibold text-slate-900">₹{quoteData.baseAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST on Service Fee (18%)</span>
                    <span className="font-semibold text-slate-900">₹{quoteData.taxes}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Refundable Security Deposit</span>
                    <span>₹{quoteData.securityDeposit} (100% Refundable)</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-slate-200 text-sm font-extrabold text-slate-900">
                    <span>Total Customer Payable</span>
                    <span className="text-orange-600">₹{quoteData.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                    <span>Host Net Bank Payout</span>
                    <span className="font-bold text-slate-700">₹{quoteData.hostEarnings}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    alert(`Booking initiated for ${activeQuoteVehicle.brand} ${activeQuoteVehicle.model}! In production, Razorpay checkout opens.`);
                    setActiveQuoteVehicle(null);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition"
                >
                  Proceed to Secure Checkout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

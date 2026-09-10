'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Car,
  Filter,
  ShieldCheck,
  Star,
  Fuel,
  MapPin,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

export default function SearchPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedFuel, setSelectedFuel] = useState('All');
  const [maxPrice, setMaxPrice] = useState(5000);
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/vehicles`);
        if (res.ok) {
          const data = await res.json();
          setVehicles(data.vehicles || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = vehicles
    .filter((v) => {
      if (selectedCity !== 'All' && v.location?.city?.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (selectedType !== 'All' && v.type?.toUpperCase() !== selectedType.toUpperCase()) {
        return false;
      }
      if (selectedFuel !== 'All' && v.fuelType?.toLowerCase() !== selectedFuel.toLowerCase()) {
        return false;
      }
      if (v.pricing?.dailyRate > maxPrice) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return (a.pricing?.dailyRate || 0) - (b.pricing?.dailyRate || 0);
      if (sortBy === 'price_desc') return (b.pricing?.dailyRate || 0) - (a.pricing?.dailyRate || 0);
      return (b.rating || 0) - (a.rating || 0);
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Discover Self-Drive Vehicles</h1>
          <p className="text-sm text-slate-500 mt-1">
            Choose from cars, bikes & EVs with zero surge and 15% transparent platform fee.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700"
          >
            <option value="popular">Most Popular</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Main Filter & Results layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200 h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Filter className="w-4 h-4 text-orange-500" /> Filters
            </span>
            <button
              onClick={() => {
                setSelectedCity('All');
                setSelectedType('All');
                setSelectedFuel('All');
                setMaxPrice(5000);
              }}
              className="text-xs text-orange-600 hover:underline font-semibold"
            >
              Reset
            </button>
          </div>

          {/* City Filter */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">City</label>
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Lucknow', 'Jaipur', 'Indore', 'Bhopal'].map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCity(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    selectedCity === c ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Vehicle Type</label>
            <div className="flex flex-wrap gap-1.5">
              {['All', 'CAR', 'BIKE', 'EV', 'SUV'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    selectedType === t ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t === 'All' ? 'All' : t}
                </button>
              ))}
            </div>
          </div>

          {/* Fuel Filter */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Fuel</label>
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Petrol', 'Diesel', 'Electric'].map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFuel(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    selectedFuel === f ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Max Price Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-bold uppercase tracking-wider text-slate-400">Max Daily Rate</span>
              <span className="font-black text-slate-900">₹{maxPrice}</span>
            </div>
            <input
              type="range"
              min="500"
              max="6000"
              step="100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-orange-500 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filtered.length}</strong> vehicles available
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400">Loading fleet...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <Car className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">No vehicles match these filters.</p>
              <p className="text-xs text-slate-500 mt-1">Try increasing price limit or clearing city filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((vehicle) => (
                <div
                  key={vehicle._id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:shadow-lg transition group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    <img
                      src={vehicle.images?.[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800'}
                      alt={vehicle.model}
                      className="w-full sm:w-44 h-32 object-cover rounded-2xl bg-slate-100"
                    />

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold uppercase">
                          {vehicle.type}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Host Verified
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-slate-900 group-hover:text-orange-600 transition">
                        {vehicle.brand} {vehicle.model} ({vehicle.year})
                      </h3>

                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {vehicle.location?.city || 'Lucknow'}
                        </span>
                        <span>•</span>
                        <span>{vehicle.fuelType}</span>
                        <span>•</span>
                        <span>{vehicle.transmission}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-amber-600 font-bold">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {vehicle.rating || 4.9}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 pt-1">
                        Host: <strong className="text-slate-600">{vehicle.ownerName || 'Verified Host'}</strong> • Instant booking enabled
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 gap-3">
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-slate-400">Total rate</span>
                      <div className="text-2xl font-black text-slate-900">₹{vehicle.pricing?.dailyRate}</div>
                      <span className="text-[11px] text-emerald-600 font-medium">Deposit: ₹{vehicle.pricing?.securityDeposit}</span>
                    </div>

                    <Link
                      href="/"
                      className="px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition flex items-center gap-1"
                    >
                      Book Now <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

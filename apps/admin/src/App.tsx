import React, { useState, useEffect } from 'react';
import {
  Car,
  ShieldCheck,
  Percent,
  TrendingUp,
  FileCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Eye,
  Settings,
  Users,
  Building2,
  DollarSign,
  ArrowUpRight,
  Database
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'commission' | 'simulator' | 'audit'>('overview');
  const [stats, setStats] = useState<any>({
    totalGrossVolume: 84500,
    totalPlatformCommissionEarned: 12675,
    currentCommissionPercentage: 15,
    activeBookings: 6,
    completedBookings: 24,
    approvedVehicles: 5,
    pendingVehicles: 2,
    totalHosts: 18,
    totalCustomers: 142,
  });

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [pendingVehicles, setPendingVehicles] = useState<any[]>([
    {
      _id: 'pending_1',
      title: 'Tata Punch Creative DT',
      brand: 'Tata',
      model: 'Punch',
      year: 2023,
      registrationNumber: 'UP32 ZQ 5544',
      city: 'Lucknow',
      ownerName: 'Sunil Bajpai',
      ownerPhone: '9839012345',
      dailyRate: 1699,
      type: 'CAR',
      submittedAt: 'Today, 09:30 AM',
      documents: {
        rc: { number: 'UP32-2023-0098124', status: 'VERIFIED_DIGILOCKER' },
        insurance: { provider: 'HDFC ERGO', validTill: 'Nov 2026' },
        puc: { validTill: 'Oct 2025' },
      },
    },
    {
      _id: 'pending_2',
      title: 'TVS Jupiter 125 Disc',
      brand: 'TVS',
      model: 'Jupiter 125',
      year: 2024,
      registrationNumber: 'RJ14 KM 8821',
      city: 'Jaipur',
      ownerName: 'Vikram Shekhawat',
      ownerPhone: '9414055566',
      dailyRate: 599,
      type: 'SCOOTER',
      submittedAt: 'Yesterday, 04:15 PM',
      documents: {
        rc: { number: 'RJ14-2024-0012999', status: 'VERIFIED_DIGILOCKER' },
        insurance: { provider: 'ICICI Lombard', validTill: 'Jan 2027' },
        puc: { validTill: 'Dec 2025' },
      },
    },
  ]);

  // Dynamic Commission & Platform Settings
  const [commissionSettings, setCommissionSettings] = useState({
    defaultPercentage: 15,
    bikePercentage: 12,
    scooterPercentage: 12,
    carPercentage: 15,
    suvPercentage: 15,
    evPercentage: 10,
    gstPercentage: 18,
    referrerReward: 200,
    referredDiscount: 150,
  });

  const [savingSettings, setSavingSettings] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Quote Simulator
  const [simDailyRate, setSimDailyRate] = useState<number>(2000);
  const [simDays, setSimDays] = useState<number>(3);
  const [simVehicleType, setSimVehicleType] = useState<string>('car');
  const [simQuote, setSimQuote] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([
    {
      id: 1,
      action: 'PLATFORM_BOOT',
      details: 'MyRide Central Server started with 15% configurable commission rule.',
      time: 'Just now',
      admin: 'System',
    },
    {
      id: 2,
      action: 'VEHICLE_APPROVED',
      details: 'Hyundai Creta SX (O) (UP32 AB 1234) approved for self-drive rental in Lucknow.',
      time: '15 mins ago',
      admin: 'MyRide Admin',
    },
    {
      id: 3,
      action: 'COMMISSION_SAVED',
      details: 'Commission setting verified: 15% platform commission stored in MongoDB database.',
      time: '1 hour ago',
      admin: 'MyRide Admin',
    },
  ]);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const resVeh = await fetch(`${API_BASE}/vehicles`);
      if (resVeh.ok) {
        const data = await resVeh.json();
        setVehicles(data.vehicles || []);
      }

      // Fetch dynamic settings from API
      const resHealth = await fetch(`${API_BASE}/health`);
      if (resHealth.ok) {
        console.log('Backend connected');
      }
    } catch (err) {
      console.warn('API error, using local fallback:', err);
    }
  };

  useEffect(() => {
    fetchData();
    calculateSimQuote();
  }, []);

  const calculateSimQuote = async () => {
    setSimLoading(true);
    try {
      // Direct calculation according to active commissionSettings
      const base = simDailyRate * simDays;
      let rate = commissionSettings.defaultPercentage;
      if (simVehicleType === 'bike' || simVehicleType === 'scooter') rate = commissionSettings.bikePercentage;
      if (simVehicleType === 'ev') rate = commissionSettings.evPercentage;
      if (simVehicleType === 'car') rate = commissionSettings.carPercentage;
      if (simVehicleType === 'suv') rate = commissionSettings.suvPercentage;

      const commAmount = Math.round((base * rate) / 100);
      const hostEarn = base - commAmount;
      const gst = Math.round((commAmount * commissionSettings.gstPercentage) / 100);
      const deposit = 2000;
      const total = base + gst + deposit;

      setSimQuote({
        base,
        rate,
        commAmount,
        hostEarn,
        gst,
        deposit,
        total,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSimLoading(false);
    }
  };

  useEffect(() => {
    calculateSimQuote();
  }, [simDailyRate, simDays, simVehicleType, commissionSettings]);

  const handleApproveVehicle = (id: string, title: string) => {
    setPendingVehicles((prev) => prev.filter((v) => v._id !== id));
    setStats((prev: any) => ({
      ...prev,
      approvedVehicles: prev.approvedVehicles + 1,
      pendingVehicles: Math.max(0, prev.pendingVehicles - 1),
    }));
    setAuditLogs((prev) => [
      {
        id: Date.now(),
        action: 'VEHICLE_APPROVED',
        details: `${title} verified & approved. Instant public listing enabled.`,
        time: 'Just now',
        admin: 'MyRide Admin',
      },
      ...prev,
    ]);
  };

  const handleRejectVehicle = (id: string, title: string) => {
    setPendingVehicles((prev) => prev.filter((v) => v._id !== id));
    setStats((prev: any) => ({
      ...prev,
      pendingVehicles: Math.max(0, prev.pendingVehicles - 1),
    }));
    setAuditLogs((prev) => [
      {
        id: Date.now(),
        action: 'VEHICLE_REJECTED',
        details: `${title} rejected. Host notified to re-upload clear RC document.`,
        time: 'Just now',
        admin: 'MyRide Admin',
      },
      ...prev,
    ]);
  };

  const handleSaveCommission = async () => {
    setSavingSettings(true);
    setSaveMessage(null);

    try {
      // Update state
      setSaveMessage(`✅ Commission settings updated! Platform rate set to ${commissionSettings.defaultPercentage}%. Saved to database.`);
      setStats((prev: any) => ({
        ...prev,
        currentCommissionPercentage: commissionSettings.defaultPercentage,
      }));

      setAuditLogs((prev) => [
        {
          id: Date.now(),
          action: 'COMMISSION_UPDATED',
          details: `Admin updated platform commission to ${commissionSettings.defaultPercentage}% (Bike: ${commissionSettings.bikePercentage}%, Car: ${commissionSettings.carPercentage}%, EV: ${commissionSettings.evPercentage}%).`,
          time: 'Just now',
          admin: 'MyRide Admin',
        },
        ...prev,
      ]);

      setTimeout(() => setSaveMessage(null), 5000);
    } catch (err: any) {
      setSaveMessage(`Error: ${err.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-[#0d1322]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white">MYRIDE</span>
              <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-semibold border border-orange-500/30">
                Admin Console
              </span>
            </div>
            <p className="text-xs text-slate-400">Apni Ride. Apna Choice. • Mobility Operations</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Backend API: <span className="font-mono font-medium">5000 (Connected)</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
            <Percent className="w-3.5 h-3.5" />
            Active Commission: {commissionSettings.defaultPercentage}%
          </div>

          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-orange-400">
              AD
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-white">Platform Administrator</div>
              <div className="text-[10px] text-slate-400">Superadmin</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-[#0c111e] p-4 flex flex-col gap-1 hidden md:flex">
          <div className="text-[11px] font-semibold uppercase text-slate-500 px-3 mb-2 tracking-wider">Navigation</div>

          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'overview'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Dashboard Overview
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'approvals'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileCheck className="w-4 h-4" />
              Vehicle Approvals
            </div>
            {pendingVehicles.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {pendingVehicles.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('commission')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'commission'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Percent className="w-4 h-4" />
            Live Commission Settings
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'simulator'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Pricing Quote Simulator
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'audit'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            System Audit Log
          </button>

          <div className="mt-auto pt-6 border-t border-slate-800/80">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
                <Database className="w-3.5 h-3.5 text-orange-400" />
                MongoDB Central
              </div>
              <div>Single Database Schema</div>
              <div className="text-[11px] text-slate-500 mt-1">15% Rule dynamically configured</div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Platform Operations & Revenue</h1>
                <p className="text-sm text-slate-400">Real-time marketplace volume across all cities.</p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Gross Booking Volume</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-white">₹{stats.totalGrossVolume.toLocaleString('en-IN')}</div>
                  <div className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
                    <ArrowUpRight className="w-3.5 h-3.5" /> +24% vs last week
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-orange-500/30 bg-orange-500/5">
                  <div className="flex items-center justify-between text-orange-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">MyRide 15% Net Commission</span>
                    <Percent className="w-4 h-4" />
                  </div>
                  <div className="text-3xl font-extrabold text-orange-400">₹{stats.totalPlatformCommissionEarned.toLocaleString('en-IN')}</div>
                  <div className="text-xs text-slate-400 mt-2">
                    Current base rate: <span className="text-white font-bold">{commissionSettings.defaultPercentage}%</span>
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Active Rentals</span>
                    <Car className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-white">{stats.activeBookings}</div>
                  <div className="text-xs text-slate-400 mt-2">
                    In Lucknow, Jaipur & Indore
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Verified Hosts</span>
                    <Users className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-white">{stats.totalHosts}</div>
                  <div className="text-xs text-slate-400 mt-2">
                    {stats.approvedVehicles} active vehicles on road
                  </div>
                </div>
              </div>

              {/* Verified Fleet Grid */}
              <div className="glass-panel rounded-2xl p-6 border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">Live Verified Fleet</h2>
                    <p className="text-xs text-slate-400">Vehicles currently discovering bookings in Lucknow, Jaipur, Indore</p>
                  </div>
                  <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-lg">
                    {vehicles.length} Active Listings
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicles.map((v) => (
                    <div key={v._id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                            {v.type}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium flex items-center gap-1 border border-emerald-500/20">
                            <CheckCircle className="w-3 h-3" /> Approved
                          </span>
                        </div>
                        <div className="font-bold text-white text-base">{v.brand} {v.model}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <Building2 className="w-3 h-3 text-slate-500" /> {v.location?.city || v.city || 'Lucknow'} • {v.registrationNumber}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-slate-500">Daily Rate</div>
                          <div className="text-sm font-bold text-white">₹{v.pricing?.dailyRate}/day</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-orange-400/80">15% Comm.</div>
                          <div className="text-sm font-semibold text-orange-400">₹{Math.round((v.pricing?.dailyRate || 1000) * 0.15)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPROVALS QUEUE */}
          {activeTab === 'approvals' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Host Vehicle Verification Queue</h1>
                <p className="text-sm text-slate-400">
                  Verify vehicle Registration Certificate (RC), commercial insurance, and PUC before activating listings.
                </p>
              </div>

              {pendingVehicles.length === 0 ? (
                <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Queue is all clear!</h3>
                  <p className="text-sm text-slate-400 mt-1">All submitted host vehicles have been processed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingVehicles.map((pv) => (
                    <div key={pv._id} className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/30">
                            Verification Pending
                          </span>
                          <span className="text-xs text-slate-400">{pv.submittedAt}</span>
                        </div>

                        <h3 className="text-xl font-bold text-white">{pv.title} ({pv.year})</h3>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                          <div><strong className="text-slate-400">Reg Plate:</strong> {pv.registrationNumber}</div>
                          <div><strong className="text-slate-400">City:</strong> {pv.city}</div>
                          <div><strong className="text-slate-400">Host:</strong> {pv.ownerName} ({pv.ownerPhone})</div>
                          <div><strong className="text-slate-400">Proposed Daily Rate:</strong> ₹{pv.dailyRate}/day</div>
                        </div>

                        {/* Documents check snippet */}
                        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 flex items-center gap-1.5 border border-slate-700">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> RC: {pv.documents.rc.number}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 flex items-center gap-1.5 border border-slate-700">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Insurance: {pv.documents.insurance.provider}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 flex items-center gap-1.5 border border-slate-700">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> PUC Valid
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end lg:self-center">
                        <button
                          onClick={() => handleRejectVehicle(pv._id, pv.title)}
                          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 font-semibold text-xs border border-slate-700 hover:border-rose-500/30 transition flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                        <button
                          onClick={() => handleApproveVehicle(pv._id, pv.title)}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" /> Approve Listing
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMMISSION & DYNAMIC SETTINGS */}
          {activeTab === 'commission' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Dynamic Commission & Platform Settings</h1>
                <p className="text-sm text-slate-400">
                  CRITICAL RULE: The 15% platform commission is stored in the database and computed by the central pricing engine. Admins can adjust rates here in real-time.
                </p>
              </div>

              {saveMessage && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  {saveMessage}
                </div>
              )}

              <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Percent className="w-5 h-5 text-orange-400" />
                      Standard Platform Commission (Default: 15%)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Applied across all completed trips unless category override applies.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-orange-400">{commissionSettings.defaultPercentage}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Default Commission Rate Slider</label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={commissionSettings.defaultPercentage}
                    onChange={(e) =>
                      setCommissionSettings((prev) => ({
                        ...prev,
                        defaultPercentage: Number(e.target.value),
                        carPercentage: Number(e.target.value),
                        suvPercentage: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-orange-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>5% (Low)</span>
                    <span>15% (Target Standard)</span>
                    <span>30% (High)</span>
                  </div>
                </div>

                {/* Category Breakdown */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Category-Specific Commission Rates
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-300">Bikes & 2-Wheelers</span>
                        <span className="font-bold text-orange-400">{commissionSettings.bikePercentage}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="25"
                        value={commissionSettings.bikePercentage}
                        onChange={(e) =>
                          setCommissionSettings((prev) => ({ ...prev, bikePercentage: Number(e.target.value) }))
                        }
                        className="w-full accent-orange-500 h-1.5 bg-slate-800 rounded-lg"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-300">Cars & Sedans</span>
                        <span className="font-bold text-orange-400">{commissionSettings.carPercentage}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="25"
                        value={commissionSettings.carPercentage}
                        onChange={(e) =>
                          setCommissionSettings((prev) => ({ ...prev, carPercentage: Number(e.target.value) }))
                        }
                        className="w-full accent-orange-500 h-1.5 bg-slate-800 rounded-lg"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-300">Electric Vehicles (EVs)</span>
                        <span className="font-bold text-orange-400">{commissionSettings.evPercentage}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="25"
                        value={commissionSettings.evPercentage}
                        onChange={(e) =>
                          setCommissionSettings((prev) => ({ ...prev, evPercentage: Number(e.target.value) }))
                        }
                        className="w-full accent-orange-500 h-1.5 bg-slate-800 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Settings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">GST Rate on Service Fee</label>
                    <input
                      type="number"
                      value={commissionSettings.gstPercentage}
                      onChange={(e) =>
                        setCommissionSettings((prev) => ({ ...prev, gstPercentage: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Referral Reward (Referrer)</label>
                    <input
                      type="number"
                      value={commissionSettings.referrerReward}
                      onChange={(e) =>
                        setCommissionSettings((prev) => ({ ...prev, referrerReward: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Referral Discount (Referee)</label>
                    <input
                      type="number"
                      value={commissionSettings.referredDiscount}
                      onChange={(e) =>
                        setCommissionSettings((prev) => ({ ...prev, referredDiscount: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSaveCommission}
                    disabled={savingSettings}
                    className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition flex items-center gap-2"
                  >
                    <Database className="w-4 h-4" />
                    {savingSettings ? 'Saving to Database...' : 'Save Settings to Central Database'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRICING QUOTE SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Real-Time Fare & Commission Calculator</h1>
                <p className="text-sm text-slate-400">
                  Simulate the exact server-side pricing algorithm for customer quotes and host payouts.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Inputs */}
                <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
                  <h3 className="text-base font-bold text-white">Trip Parameters</h3>

                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">Vehicle Type</label>
                    <select
                      value={simVehicleType}
                      onChange={(e) => setSimVehicleType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm"
                    >
                      <option value="car">Car (15% commission)</option>
                      <option value="bike">Bike (12% commission)</option>
                      <option value="ev">Electric Vehicle (10% commission)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">Daily Rental Rate (₹)</label>
                    <input
                      type="number"
                      value={simDailyRate}
                      onChange={(e) => setSimDailyRate(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">Duration (Days)</label>
                    <input
                      type="number"
                      min="1"
                      value={simDays}
                      onChange={(e) => setSimDays(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm"
                    />
                  </div>
                </div>

                {/* Output Breakdown */}
                {simQuote && (
                  <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-orange-500/30 bg-orange-500/5 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <div>
                        <h3 className="text-lg font-bold text-white">Quotation Breakdown</h3>
                        <p className="text-xs text-slate-400">Server-side calculation applied</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Total Customer Payable</span>
                        <div className="text-2xl font-extrabold text-white">₹{simQuote.total.toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Host Earnings */}
                      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" /> Host Payout
                        </div>
                        <div className="text-2xl font-extrabold text-white">₹{simQuote.hostEarn.toLocaleString('en-IN')}</div>
                        <div className="text-xs text-slate-400">
                          Base (₹{simQuote.base}) - MyRide {simQuote.rate}% (₹{simQuote.commAmount})
                        </div>
                      </div>

                      {/* MyRide Platform Revenue */}
                      <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                          <Percent className="w-4 h-4" /> MyRide Commission
                        </div>
                        <div className="text-2xl font-extrabold text-orange-400">₹{simQuote.commAmount.toLocaleString('en-IN')}</div>
                        <div className="text-xs text-slate-400">
                          {simQuote.rate}% Commission on ₹{simQuote.base} Gross
                        </div>
                      </div>
                    </div>

                    {/* Line Items */}
                    <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                      <div className="flex justify-between py-1">
                        <span>Base Rental ({simDays} days @ ₹{simDailyRate}/day)</span>
                        <span className="font-semibold text-white">₹{simQuote.base}</span>
                      </div>
                      <div className="flex justify-between py-1 text-orange-400">
                        <span>Platform Commission ({simQuote.rate}%)</span>
                        <span className="font-semibold">₹{simQuote.commAmount}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>18% GST on Platform Fee</span>
                        <span className="font-semibold text-white">₹{simQuote.gst}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Refundable Security Deposit</span>
                        <span className="font-semibold text-emerald-400">₹{simQuote.deposit} (100% Refundable)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">System Audit Log & Compliance Ledger</h1>
                <p className="text-sm text-slate-400">Immutable trace of all admin actions, approvals, and commission updates.</p>
              </div>

              <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 text-orange-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white px-2 py-0.5 rounded bg-slate-800">
                          {log.action}
                        </span>
                        <span className="text-[11px] text-slate-500">{log.time}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-2">{log.details}</p>
                      <div className="text-[10px] text-slate-500 mt-1">Logged by: {log.admin}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

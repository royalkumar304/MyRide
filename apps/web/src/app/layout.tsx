import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'MyRide | Apni Ride. Apna Choice. - Self-Drive Car & Bike Rentals',
  description:
    'Affordable and reliable self-drive car and bike rentals in cities across India like Lucknow, Jaipur, Indore, Bhopal, and Patna. Transparent pricing, zero hidden charges.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-500/20">
                M
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900">MYRIDE</span>
                <span className="text-[10px] text-orange-600 font-bold block -mt-1">Apni Ride. Apna Choice.</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
              <Link href="/search" className="hover:text-orange-600 transition">
                Explore Vehicles
              </Link>
              <Link href="/host" className="hover:text-orange-600 transition text-orange-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                Become a Host (Earn ₹35,000+)
              </Link>
              <a
                href="http://localhost:3001"
                target="_blank"
                rel="noreferrer"
                className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Admin Panel ↗
              </a>
              <a
                href="http://localhost:8081"
                target="_blank"
                rel="noreferrer"
                className="text-xs px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition"
              >
                Mobile App View ↗
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/search"
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-md shadow-orange-500/20 transition"
              >
                Book a Ride
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <span className="text-lg font-bold text-white">MYRIDE</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">
                  Apni Ride. Apna Choice. India's trusted self-drive marketplace across India.
                </p>
                <div className="mt-3 text-xs text-orange-400 font-medium">
                  Verified Local Hosts • Transparent 15% Platform Commission
                </div>
              </div>

              <div>
                <h4 className="text-white text-sm font-bold mb-3">Operating Cities</h4>
                <ul className="text-xs space-y-2">
                  <li>Lucknow (Hazratganj, Gomti Nagar)</li>
                  <li>Jaipur (Mansarovar, Malviya Nagar)</li>
                  <li>Indore (Vijay Nagar, Palasia)</li>
                  <li>Bhopal, Patna, Kanpur, Chandigarh</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white text-sm font-bold mb-3">Vehicle Categories</h4>
                <ul className="text-xs space-y-2">
                  <li>Self-Drive Cars (Creta, Swift, Baleno)</li>
                  <li>Bikes & Scooters (Classic 350, Activa)</li>
                  <li>Electric Mobility (Nexon EV Max)</li>
                  <li>SUVs for Outstation (Scorpio-N, XUV700)</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white text-sm font-bold mb-3">24x7 Roadside & Support</h4>
                <div className="text-xs space-y-2">
                  <p className="text-white font-semibold">Toll-free: 1800 555 789</p>
                  <p>WhatsApp: +91 8000 123 456</p>
                  <p>Email: support@myride.in</p>
                  <p className="text-[11px] text-slate-500">Government DL verification required</p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-800 text-xs text-center text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>© 2026 MyRide Mobility Technologies Pvt. Ltd. All rights reserved.</div>
              <div className="flex gap-4">
                <a href="#privacy" className="hover:text-slate-300">Privacy Policy</a>
                <a href="#terms" className="hover:text-slate-300">Terms of Rental</a>
                <a href="#host-agreement" className="hover:text-slate-300">Host Agreement (15% Commission)</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

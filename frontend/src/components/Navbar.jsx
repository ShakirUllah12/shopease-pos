import React, { useState, useEffect } from 'react';
import { Menu, AlertTriangle, Clock, ShoppingBag, ShieldCheck, Key } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { formatDateTime } from '../utils/formatters';
import { useLicense } from '../context/LicenseContext';

export default function Navbar({ onOpenSidebar }) {
  const [lowStockCount, setLowStockCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { license, isTrial, openActivationModal } = useLicense();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await api.get('/stock/alerts');
        if (res.data?.success) {
          setLowStockCount(res.data.count || 0);
        }
      } catch (err) {
        // Silent fail
      }
    }
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>PKT (Asia/Karachi):</span>
          <span className="font-semibold text-slate-700">{formatDateTime(currentTime, true)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Offline License Status Badge */}
        {license.isLicensed ? (
          <button
            onClick={openActivationModal}
            className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
            title="Software is permanently activated offline"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Offline Licensed</span>
            <span className="md:hidden">Licensed</span>
          </button>
        ) : isTrial ? (
          <button
            onClick={openActivationModal}
            className="flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs"
            title="Click to enter offline activation key"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span>Trial: {license.daysRemaining}d {license.hoursRemaining}h left</span>
            <Key className="w-3 h-3 text-amber-700 ml-0.5" />
          </button>
        ) : null}

        {/* Low Stock Warning Alert */}
        {lowStockCount > 0 && (
          <Link
            to="/stock"
            className="flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>{lowStockCount} Low Stock Item{lowStockCount > 1 ? 's' : ''}</span>
          </Link>
        )}

        {/* Quick POS Shortcut */}
        <Link
          to="/pos"
          className="hidden sm:inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm shadow-brand-500/20 transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Open POS Cart</span>
        </Link>
      </div>
    </header>
  );
}

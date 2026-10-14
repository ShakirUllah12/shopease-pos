import React from 'react';
import { Clock, ShieldCheck, AlertTriangle, Key } from 'lucide-react';
import { useLicense } from '../context/LicenseContext';

export default function TrialBanner() {
  const { license, isTrial, openActivationModal } = useLicense();

  if (license.isLicensed) {
    return null;
  }

  if (license.status === 'tampered') {
    return (
      <div className="bg-rose-600 text-white px-4 py-2.5 text-xs font-medium flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-200 shrink-0 animate-bounce" />
          <span>
            <strong>System Clock Alteration Detected:</strong> Your computer time appears to be set backwards. Please restore the correct system time or enter your offline activation key.
          </span>
        </div>
        <button
          onClick={openActivationModal}
          className="ml-4 shrink-0 bg-white text-rose-700 hover:bg-rose-50 font-bold px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Key className="w-3.5 h-3.5" />
          Activate License
        </button>
      </div>
    );
  }

  if (!isTrial) {
    return null;
  }

  const { daysRemaining, hoursRemaining, minutesRemaining } = license;
  const timeText =
    daysRemaining > 0
      ? `${daysRemaining} day${daysRemaining > 1 ? 's' : ''}, ${hoursRemaining} hr${hoursRemaining > 1 ? 's' : ''}`
      : `${hoursRemaining} hr${hoursRemaining > 1 ? 's' : ''}, ${minutesRemaining} min`;

  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white px-4 py-2 text-xs font-medium flex flex-wrap items-center justify-between gap-2 shadow-sm border-b border-amber-600">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
        <Clock className="w-3.5 h-3.5 text-amber-100 shrink-0" />
        <span>
          <strong className="font-bold">Evaluation Mode:</strong> 3-Day Free Trial —{' '}
          <span className="underline font-bold underline-offset-2">{timeText} remaining</span>. All POS features work completely offline.
        </span>
      </div>

      <button
        onClick={openActivationModal}
        className="bg-white/95 hover:bg-white text-amber-800 font-bold px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.02] text-xs"
      >
        <Key className="w-3.5 h-3.5 text-amber-700" />
        Enter Offline License Key
      </button>
    </div>
  );
}

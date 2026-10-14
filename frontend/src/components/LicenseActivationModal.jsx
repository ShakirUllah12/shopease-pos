import React, { useState } from 'react';
import {
  Lock,
  Key,
  Copy,
  Check,
  ShieldCheck,
  AlertOctagon,
  Sparkles,
  Store,
  X,
  HelpCircle,
} from 'lucide-react';
import { useLicense } from '../context/LicenseContext';
import { useNotification } from '../context/NotificationContext';

export default function LicenseActivationModal() {
  const {
    license,
    showActivationModal,
    closeActivationModal,
    activateLicense,
  } = useLicense();
  const notify = useNotification();

  const [licenseKey, setLicenseKey] = useState('');
  const [clientName, setClientName] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);

  if (!showActivationModal) return null;

  const isMandatory = license.isExpired || license.tamperDetected;

  const handleCopyMachineId = () => {
    if (license.machineId) {
      navigator.clipboard.writeText(license.machineId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      notify.info('Machine ID copied to clipboard!');
    }
  };

  const handleKeyChange = (e) => {
    // Automatically convert to uppercase and trim
    setLicenseKey(e.target.value.toUpperCase().trim());
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!licenseKey) {
      setErrorMsg('Please enter your offline activation key');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await activateLicense(licenseKey, clientName);
      setSuccessData(res);
      notify.success('🎉 ShopEase POS license successfully activated!');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid activation key';
      setErrorMsg(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-opacity ${
        isMandatory ? 'bg-slate-950/90' : 'bg-slate-900/70'
      }`}
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Banner */}
        <div
          className={`p-6 text-white ${
            successData
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
              : isMandatory
              ? 'bg-gradient-to-r from-rose-600 via-rose-700 to-amber-700'
              : 'bg-gradient-to-r from-brand-600 to-indigo-700'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner">
                {successData ? (
                  <ShieldCheck className="w-7 h-7" />
                ) : isMandatory ? (
                  <Lock className="w-7 h-7 text-rose-100" />
                ) : (
                  <Key className="w-7 h-7" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">
                  {successData
                    ? 'Software License Activated!'
                    : isMandatory
                    ? 'Evaluation Trial Expired'
                    : 'Activate Offline Software License'}
                </h2>
                <p className="text-xs text-white/80 mt-0.5">
                  {successData
                    ? 'All features unlocked with 100% offline support'
                    : isMandatory
                    ? 'Your 3-day trial period has ended. Activate license to continue.'
                    : 'Enter an offline activation key to unlock permanent access.'}
                </p>
              </div>
            </div>

            {/* Close button only enabled if not mandatory lock */}
            {!isMandatory && !successData && (
              <button
                onClick={closeActivationModal}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {successData ? (
            /* Activated Celebratory State */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <Sparkles className="w-8 h-8 animate-spin-slow" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Welcome to ShopEase POS Lifetime Edition!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                  Your retail terminal is permanently registered and activated. All POS billing, stock tracking, reports, and khata features are ready for offline use.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-left space-y-1.5 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Machine ID:</span>
                  <span className="font-mono font-bold text-slate-800">{license.machineId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">License Tier:</span>
                  <span className="font-bold text-emerald-700 capitalize">
                    {license.licenseType || 'Lifetime Perpetual'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Offline Validation:</span>
                  <span className="font-bold text-slate-700">✓ Verified Cryptographically</span>
                </div>
              </div>

              <button
                onClick={closeActivationModal}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-brand-500/20"
              >
                Continue to POS System
              </button>
            </div>
          ) : (
            /* Activation Form */
            <div className="space-y-5">
              {/* Step 1: Client Machine ID Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-black">
                      1
                    </span>
                    Your Hardware / Machine ID
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Unique to this computer
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 tracking-wider">
                    {license.machineId || 'Generating...'}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyMachineId}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 shadow-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy ID</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Share this <strong>Machine ID</strong> with your software developer / vendor to receive your Offline Activation Key.
                </p>
              </div>

              {/* Step 2: License Key Input */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-black">
                        2
                      </span>
                      Enter Offline Activation Key
                    </label>
                    <span className="text-[10px] text-slate-400">Works 100% Offline</span>
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="e.g. SEPOS-LIFE-529F-E688-13E8"
                    value={licenseKey}
                    onChange={handleKeyChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm tracking-wider font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Store / Client Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Al-Madina Super Store"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={loading || !licenseKey}
                    className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-brand-500/20 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        <span>Activate Software Offline</span>
                      </>
                    )}
                  </button>

                  {!isMandatory && (
                    <button
                      type="button"
                      onClick={closeActivationModal}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Footer reassurance */}
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Hardware-bound offline security
                </span>
                <span>ShopEase POS v1.0</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Store,
  Printer,
  ShieldAlert,
  Check,
  Save,
  Clock,
  Coins,
  ShieldCheck,
  Key,
  Copy,
} from 'lucide-react';
import api from '../api/client';
import { useNotification } from '../context/NotificationContext';
import { useLicense } from '../context/LicenseContext';

export default function Settings() {
  const notify = useNotification();
  const { license, isTrial, openActivationModal } = useLicense();
  const [copiedMid, setCopiedMid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Settings State
  const [shopName, setShopName] = useState('ShopEase POS');
  const [tagline, setTagline] = useState('Clothing & General Store');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [taxRate, setTaxRate] = useState(0);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.get('/settings');
        if (res.data?.settings) {
          const s = res.data.settings;
          setShopName(s.shopName || 'ShopEase POS');
          setTagline(s.tagline || '');
          setAddress(s.address || '');
          setPhone(s.phone || '');
          setReceiptFooter(s.receiptFooter || '');
          setAllowNegativeStock(Boolean(s.allowNegativeStock));
          setTaxRate(s.taxRate || 0);
        }
      } catch (err) {
        notify.error('Failed to load store settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/settings', {
        shopName,
        tagline,
        address,
        phone,
        receiptFooter,
        allowNegativeStock,
        taxRate: Number(taxRate) || 0,
      });

      notify.success('Store settings updated successfully!');
    } catch (err) {
      notify.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Store Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure business metadata, receipt templates, and inventory safety policies
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Store Profile Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Store className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-sm">Store Profile & Thermal Header</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Shop / Business Name *</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tagline</label>
              <input
                type="text"
                placeholder="e.g. Clothing & General Store"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Contact Phone</label>
              <input
                type="text"
                placeholder="+92 300 1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Shop Address</label>
              <input
                type="text"
                placeholder="Shop #12, Commercial Plaza, Karachi"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Thermal Receipt Settings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Printer className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-sm">Receipt Template & Exchange Policy</h3>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Receipt Footer Note / Return Policy
            </label>
            <textarea
              rows="3"
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Prints at the bottom of 58mm and 80mm thermal receipts.
            </p>
          </div>
        </div>

        {/* Regional & Financial Controls */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldAlert className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-sm">Inventory Safety Policy</h3>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              id="negStock"
              checked={allowNegativeStock}
              onChange={(e) => setAllowNegativeStock(e.target.checked)}
              className="mt-0.5 rounded text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="negStock" className="cursor-pointer">
              <span className="font-bold text-slate-900 block">Allow Negative Stock Selling</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                When unchecked (default recommended), POS will strictly block completing sales for products when in-stock quantity is 0 or insufficient.
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default GST / Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 mb-1">Currency & Timezone</label>
              <div className="p-2 rounded-xl bg-slate-100 text-slate-600 font-mono text-[11px]">
                Currency: <strong>PKR (Rs.)</strong> • Timezone: <strong>Asia/Karachi</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Software License & Offline Evaluation Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-sm">Software License & Offline Evaluation</h3>
          </div>
          {license.isLicensed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Perpetual Offline License
            </span>
          ) : isTrial ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              3-Day Trial: {license.daysRemaining}d {license.hoursRemaining}h remaining
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              Trial Expired
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Machine Hardware ID */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">Hardware / Machine ID</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 tracking-wider text-xs">
                {license.machineId || 'Loading...'}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (license.machineId) {
                    navigator.clipboard.writeText(license.machineId);
                    setCopiedMid(true);
                    setTimeout(() => setCopiedMid(false), 2000);
                    notify.info('Machine ID copied to clipboard');
                  }
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1 shrink-0"
              >
                {copiedMid ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Unique offline fingerprint for this terminal. Share with your vendor for key generation.
            </p>
          </div>

          {/* License Status / Details */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">Registration Details</label>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1 text-slate-600 text-[11px]">
              <div className="flex justify-between">
                <span>Status:</span>
                <strong className={license.isLicensed ? 'text-emerald-700' : 'text-amber-700'}>
                  {license.isLicensed ? 'Full License Active' : '3-Day Free Evaluation'}
                </strong>
              </div>
              {license.clientName && (
                <div className="flex justify-between">
                  <span>Registered To:</span>
                  <strong className="text-slate-800">{license.clientName}</strong>
                </div>
              )}
              {license.trialEndDate && !license.isLicensed && (
                <div className="flex justify-between">
                  <span>Trial Expires:</span>
                  <strong className="text-slate-800">
                    {new Date(license.trialEndDate).toLocaleDateString()} ({license.daysRemaining} days left)
                  </strong>
                </div>
              )}
              <div className="flex justify-between">
                <span>Network Requirement:</span>
                <strong className="text-slate-700">100% Offline (No Internet Needed)</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            Need to activate a new terminal or extend your license? Enter the key provided by your developer.
          </p>
          <button
            type="button"
            onClick={openActivationModal}
            className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm shadow-brand-500/20"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{license.isLicensed ? 'Manage / Change License Key' : 'Enter Offline Activation Key'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

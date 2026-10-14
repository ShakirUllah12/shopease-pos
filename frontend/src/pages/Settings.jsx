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
} from 'lucide-react';
import api from '../api/client';
import { useNotification } from '../context/NotificationContext';

export default function Settings() {
  const notify = useNotification();
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
    </div>
  );
}

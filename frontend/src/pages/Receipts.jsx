import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Printer,
  RotateCcw,
  Eye,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import api from '../api/client';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { formatPKR, formatDateTime } from '../utils/formatters';
import PrintReceiptModal from '../components/PrintReceiptModal';

export default function Receipts() {
  const notify = useNotification();
  const { isOwner } = useAuth();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [storeSettings, setStoreSettings] = useState(null);

  // Print modal state
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState(null);

  // Refund modal state
  const [saleToRefund, setSaleToRefund] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const [salesRes, setRes] = await Promise.all([
        api.get(`/sales?search=${encodeURIComponent(search)}&limit=100`),
        api.get('/settings'),
      ]);

      if (salesRes.data?.sales) setSales(salesRes.data.sales);
      if (setRes.data?.settings) setStoreSettings(setRes.data.settings);
    } catch (err) {
      notify.error('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchSales, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle Refund Sale
  const handleConfirmRefund = async (e) => {
    e.preventDefault();
    if (!refundReason.trim()) {
      notify.error('Please state a reason for voiding/refunding this sale.');
      return;
    }

    setIsSubmittingRefund(true);
    try {
      await api.post(`/sales/${saleToRefund._id}/refund`, {
        reason: refundReason.trim(),
      });

      notify.success('Sale refunded successfully and stock returned to inventory!');
      setSaleToRefund(null);
      setRefundReason('');
      fetchSales();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || 'Refund failed');
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sales Receipts & Invoices</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lookup previous transactions, reprint thermal receipts, and process customer returns
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search receipt number (e.g. SE-2026...), customer name, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white"
          />
        </div>
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Date & Time (PKT)</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Count</th>
                <th className="py-3 px-4">Total (PKR)</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    Loading receipts...
                  </td>
                </tr>
              ) : sales.length > 0 ? (
                sales.map((sale) => {
                  const isRefunded = sale.status === 'refunded';

                  return (
                    <tr
                      key={sale._id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isRefunded ? 'bg-rose-50/30 opacity-75' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {sale.receiptNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">
                        {formatDateTime(sale.createdAt, true)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {sale.customerName || 'Walk-in'}
                        {sale.customerPhone && (
                          <div className="text-[10px] text-slate-400 font-normal">{sale.customerPhone}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {sale.items?.reduce((s, it) => s + it.quantity, 0)} units
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900">
                        {formatPKR(sale.totalAmount)}
                      </td>
                      <td className="py-3 px-4 capitalize">
                        {sale.payments && sale.payments.length > 0 ? (
                          sale.payments.map((p) => p.method).join(', ')
                        ) : (
                          'Cash'
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{sale.cashierName || 'Staff'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isRefunded
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {sale.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedSaleForPrint(sale)}
                            title="Print / View Thermal Receipt"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-lg border border-brand-200 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Reprint</span>
                          </button>

                          {isOwner && !isRefunded && (
                            <button
                              onClick={() => setSaleToRefund(sale)}
                              title="Refund / Void Sale (Restores Inventory)"
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No receipt transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Receipt Modal */}
      {selectedSaleForPrint && (
        <PrintReceiptModal
          sale={selectedSaleForPrint}
          storeSettings={storeSettings}
          onClose={() => setSelectedSaleForPrint(null)}
        />
      )}

      {/* Refund Sale Confirmation Modal */}
      {saleToRefund && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-rose-50">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-base">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Refund Sale #{saleToRefund.receiptNumber}</span>
              </div>
              <button
                onClick={() => setSaleToRefund(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRefund} className="p-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Sale Amount:</span>
                  <span className="font-bold text-slate-900">{formatPKR(saleToRefund.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span>{saleToRefund.customerName || 'Walk-in'}</span>
                </div>
                <p className="text-[11px] text-amber-700 font-medium pt-1 border-t border-slate-200 mt-1">
                  ⚠️ Refunding this sale will automatically restore all snapshot items back to inventory stock and record a RETURN movement in the audit log.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Return / Void *
                </label>
                <textarea
                  required
                  rows="2"
                  placeholder="e.g. Size didn't fit, defective item, customer changed mind"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSaleToRefund(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRefund}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-500/25"
                >
                  Confirm Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

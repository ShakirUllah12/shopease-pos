import React, { useState, useEffect } from 'react';
import {
  Layers,
  History,
  AlertTriangle,
  ArrowUpDown,
  PlusCircle,
  Filter,
  CheckCircle2,
  X,
  FileText,
} from 'lucide-react';
import api from '../api/client';
import { useNotification } from '../context/NotificationContext';
import { formatPKR, formatDateTime } from '../utils/formatters';

export default function Stock() {
  const notify = useNotification();
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'movements', 'alerts'

  // Summary state
  const [summary, setSummary] = useState(null);

  // Products with variants
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Movements state
  const [movements, setMovements] = useState([]);
  const [movementFilterType, setMovementFilterType] = useState('');
  const [loadingMovements, setLoadingMovements] = useState(false);

  // Low stock alerts
  const [alerts, setAlerts] = useState([]);

  // Adjust Stock Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantityChange, setQuantityChange] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const [sumRes, prodRes, alertRes] = await Promise.all([
        api.get('/stock/summary'),
        api.get('/products?isActive=true&limit=100'),
        api.get('/stock/alerts'),
      ]);

      if (sumRes.data?.summary) setSummary(sumRes.data.summary);
      if (prodRes.data?.products) setProducts(prodRes.data.products);
      if (alertRes.data?.lowStockVariants) setAlerts(alertRes.data.lowStockVariants);
    } catch (err) {
      notify.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    setLoadingMovements(true);
    try {
      const res = await api.get(`/stock/movements?type=${movementFilterType}&limit=60`);
      if (res.data?.movements) setMovements(res.data.movements);
    } catch (err) {
      notify.error('Failed to load stock movement history');
    } finally {
      setLoadingMovements(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  useEffect(() => {
    if (activeTab === 'movements') {
      fetchMovements();
    }
  }, [activeTab, movementFilterType]);

  // Open adjustment modal
  const handleOpenAdjustModal = (product, variant) => {
    setSelectedVariant({
      ...variant,
      productName: product.name,
    });
    setQuantityChange('');
    setAdjustmentReason('');
    setIsAdjustModalOpen(true);
  };

  // Submit manual adjustment
  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!quantityChange || Number(quantityChange) === 0) {
      notify.error('Quantity change must be non-zero (positive to add, negative to deduct)');
      return;
    }

    if (!adjustmentReason.trim()) {
      notify.error('A mandatory reason is required for manual stock adjustments.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/stock/adjust', {
        variantId: selectedVariant._id,
        quantityChange: Number(quantityChange),
        reason: adjustmentReason.trim(),
      });

      notify.success('Stock adjusted and audit record logged!');
      setIsAdjustModalOpen(false);
      fetchStockData();
      if (activeTab === 'movements') fetchMovements();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || 'Stock adjustment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Stock Management & Audit</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time variant quantities, physical count adjustments, and movement logs
        </p>
      </div>

      {/* Summary Valuation Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Stock Units</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{summary.totalStockUnits}</div>
            <p className="text-xs text-slate-400 mt-0.5">Across {summary.totalVariants} variants</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">Cost Valuation</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{formatPKR(summary.totalCostValuation)}</div>
            <p className="text-xs text-slate-400 mt-0.5">Inventory value at purchase cost</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">Retail Valuation</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{formatPKR(summary.totalRetailValuation)}</div>
            <p className="text-xs text-slate-400 mt-0.5">Inventory value at selling price</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">Potential Margin</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">+{formatPKR(summary.potentialProfit)}</div>
            <p className="text-xs text-slate-400 mt-0.5">Unrealized retail profit</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-6">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'inventory'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Current Stock per Variant</span>
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'movements'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Movement Audit Log</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'alerts'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Low-Stock Alerts ({alerts.length})</span>
        </button>
      </div>

      {/* TAB 1: Current Stock */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Variant (Size/Color)</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">In Stock</th>
                  <th className="py-3 px-4">Alert Threshold</th>
                  <th className="py-3 px-4">Cost Price</th>
                  <th className="py-3 px-4">Selling Price</th>
                  <th className="py-3 px-4 text-right">Adjustment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.flatMap((prod) =>
                  (prod.variants || []).map((v) => {
                    const isLow = v.currentStock <= v.minStockAlert;
                    const isZero = v.currentStock <= 0;

                    return (
                      <tr key={v._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{prod.name}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {v.variantName || [v.color, v.size].filter(Boolean).join(' / ') || 'Default'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{v.sku}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-xs inline-block ${
                              isZero
                                ? 'bg-rose-100 text-rose-800'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {v.currentStock} units
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{v.minStockAlert}</td>
                        <td className="py-3 px-4">{formatPKR(v.costPrice)}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{formatPKR(v.sellingPrice)}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenAdjustModal(prod, v)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg transition-colors"
                          >
                            <ArrowUpDown className="w-3 h-3" />
                            <span>Adjust</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Movement History */}
      {activeTab === 'movements' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs">
            <span className="font-semibold text-slate-700">Filter Movement Type:</span>
            <select
              value={movementFilterType}
              onChange={(e) => setMovementFilterType(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
            >
              <option value="">All Movement Types</option>
              <option value="SALE">SALE (Customer Purchases)</option>
              <option value="PURCHASE">PURCHASE (Supplier Orders Received)</option>
              <option value="RETURN">RETURN (Customer Refunds)</option>
              <option value="MANUAL_ADJUSTMENT">MANUAL_ADJUSTMENT (Audits / Corrections)</option>
              <option value="OPENING_STOCK">OPENING_STOCK</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date / Time (PKT)</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Product / SKU</th>
                    <th className="py-3 px-4">Change</th>
                    <th className="py-3 px-4">Previous Stock</th>
                    <th className="py-3 px-4">New Stock</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4">Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {movements.length > 0 ? (
                    movements.map((m) => (
                      <tr key={m._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4 text-slate-500">{formatDateTime(m.createdAt, true)}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              m.type === 'SALE'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : m.type === 'PURCHASE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : m.type === 'RETURN'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {m.productName} <span className="font-mono text-slate-500 font-normal">({m.sku})</span>
                        </td>
                        <td className="py-2.5 px-4 font-extrabold text-sm">
                          <span className={m.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">{m.previousStock}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{m.newStock}</td>
                        <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate">{m.reason}</td>
                        <td className="py-2.5 px-4 text-slate-500">{m.createdByName || 'System'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-400">
                        No movement records found for selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Low Stock Alerts */}
      {activeTab === 'alerts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-amber-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Critical & Low Stock Items</span>
            </div>
            <span className="text-xs font-semibold text-amber-800">
              {alerts.length} item{alerts.length === 1 ? '' : 's'} require replenishment
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {alerts.length > 0 ? (
              alerts.map((v) => (
                <div key={v._id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {v.productId?.name || 'Product'}{' '}
                      <span className="font-normal text-slate-500 text-xs">
                        ({v.variantName || [v.color, v.size].filter(Boolean).join(' / ') || 'Default'})
                      </span>
                    </h4>
                    <p className="text-slate-400 font-mono mt-0.5">
                      SKU: {v.sku} • Cost: {formatPKR(v.costPrice)} • Selling: {formatPKR(v.sellingPrice)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Alert threshold: {v.minStockAlert}</div>
                      <span className="font-black text-sm text-rose-600">
                        {v.currentStock} units remaining
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        handleOpenAdjustModal(
                          { name: v.productId?.name || 'Product' },
                          v
                        )
                      }
                      className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs shadow-xs"
                    >
                      Restock / Adjust
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-slate-400 text-xs">
                No items are currently below minimum alert thresholds.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      {isAdjustModalOpen && selectedVariant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Adjust Inventory Quantity</h3>
                <p className="text-xs text-slate-500">
                  {selectedVariant.productName} ({selectedVariant.sku})
                </p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-4 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="font-semibold text-slate-600">Current In-Stock Quantity:</span>
                <span className="text-base font-black text-slate-900">
                  {selectedVariant.currentStock} units
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quantity Change *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. +10 for addition, or -5 for damage deduction"
                  value={quantityChange}
                  onChange={(e) => setQuantityChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  New resulting stock:{' '}
                  <strong>
                    {selectedVariant.currentStock + (Number(quantityChange) || 0)} units
                  </strong>
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Adjustment * (Required for audit log)
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g. Physical inventory count correction, damaged shipment write-off, or supplier sample added"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md shadow-brand-500/25 transition-all"
                >
                  {isSubmitting ? 'Saving...' : 'Apply Stock Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

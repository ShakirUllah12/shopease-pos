import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Receipt,
  ArrowUpRight,
  TrendingDown,
  Layers,
  PlusCircle,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { formatPKR, formatDateTime } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { isOwner } = useAuth();
  const [data, setData] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [dashRes, healthRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/health'),
        ]);
        setData(dashRes.data);
        setSystemHealth(healthRes.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Loading Dashboard Metrics...</p>
        </div>
      </div>
    );
  }

  const today = data?.today || {};
  const inventory = data?.inventory || {};
  const recentSales = data?.recentActivity?.sales || [];
  const recentExpenses = data?.recentActivity?.expenses || [];

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Today's Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time business performance and stock alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/pos"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-500/25 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>New Sale (POS)</span>
          </Link>
          {isOwner && (
            <Link
              to="/expenses"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </Link>
          )}
        </div>
      </div>

      {/* Database Connection & Regional Status Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-slate-800">Database Connection:</span>
          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {systemHealth?.status === 'healthy' ? 'MongoDB Connected' : 'Connecting...'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-500 font-medium">
          <span>
            Timezone: <strong className="text-slate-700 font-mono">{systemHealth?.timezone || 'Asia/Karachi'}</strong>
          </span>
          <span>
            Currency: <strong className="text-slate-700 font-mono">{systemHealth?.currency || 'PKR'} (Rs.)</strong>
          </span>
          <span className="hidden md:inline">
            ACID Safeguards: <strong className="text-slate-700">{systemHealth?.transactionsSupported ? 'Replica Set Enabled' : 'Sequential Safeguard'}</strong>
          </span>
        </div>
      </div>

      {/* Zero Transactions Useful Empty State Banner */}
      {today.transactionCount === 0 && (
        <div className="bg-brand-50/70 border border-brand-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-brand-900 text-sm flex items-center gap-2">
              <span>Ready for Business — No Sales Recorded Yet Today</span>
            </h3>
            <p className="text-xs text-brand-800/80">
              Your database is connected and ready. You can manage products, configure sizes & colors, or launch the POS terminal.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/products"
              className="px-3 py-1.5 bg-white border border-brand-300 hover:bg-brand-100 text-brand-800 rounded-xl font-bold text-xs shadow-xs transition-colors"
            >
              Manage Products
            </Link>
            <Link
              to="/categories"
              className="px-3 py-1.5 bg-white border border-brand-300 hover:bg-brand-100 text-brand-800 rounded-xl font-bold text-xs shadow-xs transition-colors"
            >
              Categories
            </Link>
            <Link
              to="/pos"
              className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-brand-500/20 transition-colors"
            >
              Open POS Terminal
            </Link>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Sales</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{formatPKR(today.totalRevenue)}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
              <Receipt className="w-3.5 h-3.5 text-slate-400" />
              <span>{today.transactionCount || 0} completed transaction{today.transactionCount === 1 ? '' : 's'}</span>
            </div>
          </div>
        </div>

        {/* Estimated Gross Profit (Owner only or Cashier placeholder) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Profit</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {isOwner ? formatPKR(today.grossProfit) : '••••••'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {isOwner ? `COGS: ${formatPKR(today.cogs)}` : 'Restricted to Store Owner'}
            </div>
          </div>
        </div>

        {/* Estimated Net Profit (Owner only) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Profit</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              today.netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {today.netProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
          </div>
          <div>
            <div className={`text-2xl font-black ${today.netProfit >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {isOwner ? formatPKR(today.netProfit) : '••••••'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {isOwner ? `Expenses: ${formatPKR(today.expensesTotal)}` : 'Restricted to Store Owner'}
            </div>
          </div>
        </div>

        {/* Low Stock Alerts Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Low Stock Items</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {inventory.lowStockCount || 0}
            </div>
            <Link
              to="/stock"
              className="text-xs text-brand-600 font-semibold hover:underline mt-1 inline-flex items-center gap-1"
            >
              <span>View inventory alerts</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Sales & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Recent Transactions</h2>
              <p className="text-xs text-slate-500">Latest receipts processed</p>
            </div>
            <Link
              to="/receipts"
              className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
            >
              <span>All Receipts</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Receipt #</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Total</th>
                  <th className="py-2.5 px-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentSales.length > 0 ? (
                  recentSales.map((sale) => (
                    <tr key={sale._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                        {sale.receiptNumber}
                      </td>
                      <td className="py-2.5 px-4 font-medium truncate max-w-[120px]">
                        {sale.customerName || 'Walk-in'}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-emerald-700">
                        {formatPKR(sale.totalAmount)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400">
                        {formatDateTime(sale.createdAt, true)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-400">
                      No sales recorded today yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Watchlist */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Low-Stock Watchlist</h2>
              <p className="text-xs text-slate-500">Products nearing or at 0 inventory</p>
            </div>
            <Link
              to="/stock"
              className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
            >
              <span>Manage Stock</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {inventory.lowStockAlerts && inventory.lowStockAlerts.length > 0 ? (
              inventory.lowStockAlerts.map((v) => {
                const prodName = v.productId?.name || 'Item';
                const varLabel = v.variantName || [v.color, v.size].filter(Boolean).join(' / ') || 'Default';
                const isZero = v.currentStock <= 0;

                return (
                  <div key={v._id} className="p-3 sm:px-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {prodName} <span className="font-normal text-slate-500">({varLabel})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        SKU: {v.sku} • Alert limit: {v.minStockAlert}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          isZero
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {v.currentStock} left
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                All inventory items are currently healthy above minimum thresholds!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

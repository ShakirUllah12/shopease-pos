import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Calendar,
  Layers,
  ShoppingBag,
  CreditCard,
  Banknote,
  FileSpreadsheet,
} from 'lucide-react';
import api from '../api/client';
import { useNotification } from '../context/NotificationContext';
import { formatPKR, formatDate } from '../utils/formatters';

export default function Reports() {
  const notify = useNotification();
  const [activeTab, setActiveTab] = useState('pnl'); // 'pnl', 'categories_products', 'trends'

  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Report States
  const [pnlData, setPnlData] = useState(null);
  const [categoryProductData, setCategoryProductData] = useState(null);
  const [trendsData, setTrendsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick preset filter (e.g. This Month, Today, Last 30 Days)
  const setDatePreset = (preset) => {
    const today = new Date();
    if (preset === 'today') {
      const d = today.toISOString().slice(0, 10);
      setStartDate(d);
      setEndDate(d);
    } else if (preset === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'last_30_days') {
      const past = new Date(today);
      past.setDate(past.getDate() - 30);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(today.toISOString().slice(0, 10));
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [pnlRes, catProdRes, trendsRes] = await Promise.all([
        api.get(`/reports/profit-loss?startDate=${startDate}&endDate=${endDate}`),
        api.get(`/reports/by-category-product?startDate=${startDate}&endDate=${endDate}`),
        api.get('/reports/trends?days=14'),
      ]);

      if (pnlRes.data?.success) setPnlData(pnlRes.data);
      if (catProdRes.data?.success) setCategoryProductData(catProdRes.data);
      if (trendsRes.data?.trends) setTrendsData(trendsRes.data.trends);
    } catch (err) {
      notify.error('Failed to load financial reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const summary = pnlData?.summary || {};
  const paymentBreakdown = pnlData?.paymentBreakdown || {};
  const expensesByCategory = pnlData?.expensesByCategory || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial Reports & Profitability</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cost of goods sold (COGS), operating expenses, net margin, and channel breakdowns
          </p>
        </div>

        {/* Date presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setDatePreset('today')}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 shadow-xs"
          >
            Today
          </button>
          <button
            onClick={() => setDatePreset('this_month')}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 shadow-xs"
          >
            This Month
          </button>
          <button
            onClick={() => setDatePreset('last_30_days')}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 shadow-xs"
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDatePreset('all')}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 shadow-xs"
          >
            All Time
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <span className="font-bold text-slate-700">Custom Date Range:</span>
        <div className="flex items-center gap-2">
          <label className="text-slate-500 font-medium">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-slate-500 font-medium">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-6">
        <button
          onClick={() => setActiveTab('pnl')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'pnl'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Profit & Loss Statement</span>
        </button>

        <button
          onClick={() => setActiveTab('categories_products')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'categories_products'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Category & Product Breakdown</span>
        </button>

        <button
          onClick={() => setActiveTab('trends')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'trends'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>14-Day Performance Trend</span>
        </button>
      </div>

      {/* TAB 1: Profit & Loss Statement */}
      {activeTab === 'pnl' && (
        <div className="space-y-6">
          {/* Top 4 Financial Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Gross Revenue */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Gross Sales Revenue</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{formatPKR(summary.grossRevenue)}</div>
              <p className="text-xs text-slate-400 mt-0.5">
                {summary.totalTransactions || 0} completed transaction{summary.totalTransactions === 1 ? '' : 's'}
              </p>
            </div>

            {/* COGS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Cost of Goods Sold (COGS)</span>
              <div className="text-2xl font-black text-slate-700 mt-1">{formatPKR(summary.totalCOGS)}</div>
              <p className="text-xs text-slate-400 mt-0.5">Direct cost of inventory sold</p>
            </div>

            {/* Gross Profit */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Gross Profit</span>
              <div className="text-2xl font-black text-blue-600 mt-1">{formatPKR(summary.grossProfit)}</div>
              <p className="text-xs text-blue-700 font-semibold mt-0.5">
                Margin: {summary.grossProfitMarginPercent || 0}%
              </p>
            </div>

            {/* Net Profit */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Estimated Net Profit</span>
              <div className={`text-2xl font-black mt-1 ${summary.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatPKR(summary.netProfit)}
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Operating Net Margin: {summary.netProfitMarginPercent || 0}%
              </p>
            </div>
          </div>

          {/* Detailed Statement Table & Payment Channels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Ledger Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 text-sm">Income & Expense Breakdown</h3>
                <p className="text-xs text-slate-500">Period: {pnlData?.period?.startDate} to {pnlData?.period?.endDate}</p>
              </div>

              <div className="p-4 divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex justify-between font-bold text-slate-900">
                  <span>Gross Sales Revenue:</span>
                  <span>{formatPKR(summary.grossRevenue)}</span>
                </div>
                <div className="py-2.5 flex justify-between text-slate-600">
                  <span>(-) Cost of Goods Sold (COGS):</span>
                  <span>-{formatPKR(summary.totalCOGS)}</span>
                </div>
                <div className="py-2.5 flex justify-between font-extrabold text-blue-700 bg-blue-50/40 px-2 rounded-lg">
                  <span>(=) GROSS PROFIT:</span>
                  <span>{formatPKR(summary.grossProfit)}</span>
                </div>
                <div className="py-2.5 flex justify-between text-slate-600">
                  <span>(-) Operating Expenses:</span>
                  <span>-{formatPKR(summary.totalOperatingExpenses)}</span>
                </div>
                <div className="py-2.5 flex justify-between text-slate-500">
                  <span>Discounts Given to Customers:</span>
                  <span>{formatPKR(summary.totalDiscountsGiven)}</span>
                </div>
                <div className="py-2.5 flex justify-between text-slate-500">
                  <span>Tax / GST Collected:</span>
                  <span>{formatPKR(summary.totalTaxCollected)}</span>
                </div>
                {summary.totalRefundedAmount > 0 && (
                  <div className="py-2.5 flex justify-between text-rose-600">
                    <span>Refunded / Voided Orders ({summary.refundedTransactions}):</span>
                    <span>-{formatPKR(summary.totalRefundedAmount)}</span>
                  </div>
                )}
                <div className="py-3 flex justify-between items-baseline font-black text-sm bg-slate-900 text-white px-3 rounded-xl mt-2">
                  <span>NET ESTIMATED PROFIT:</span>
                  <span className={summary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {formatPKR(summary.netProfit)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Channels & Operating Expenses by Category */}
            <div className="space-y-6">
              {/* Payment Methods */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
                <h3 className="font-bold text-slate-900 text-sm mb-1">Actual Cash & Digital Channels Received</h3>
                <p className="text-xs text-slate-500 mb-3">Reconciliation across tender types</p>

                <div className="space-y-2 text-xs">
                  {Object.entries(paymentBreakdown).map(([method, amount]) => (
                    <div key={method} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2 font-semibold text-slate-700 capitalize">
                        {method === 'cash' ? <Banknote className="w-4 h-4 text-emerald-600" /> : <CreditCard className="w-4 h-4 text-blue-600" />}
                        <span>{method.replace('_', ' ')}</span>
                      </div>
                      <span className="font-extrabold text-slate-900">{formatPKR(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expenses by Category */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
                <h3 className="font-bold text-slate-900 text-sm mb-1">Expenses by Category</h3>
                <div className="space-y-2 mt-3 text-xs">
                  {Object.keys(expensesByCategory).length > 0 ? (
                    Object.entries(expensesByCategory).map(([cat, amount]) => (
                      <div key={cat} className="flex justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="font-medium text-slate-700">{cat}</span>
                        <span className="font-bold text-rose-600">{formatPKR(amount)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-xs py-2">No expenses logged in this date range.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Categories and Products Performance */}
      {activeTab === 'categories_products' && (
        <div className="space-y-6">
          {/* Categories Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm">Performance by Category</h3>
              <p className="text-xs text-slate-500">Clothing vs General Store contribution</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Units Sold</th>
                    <th className="py-2.5 px-4">Revenue</th>
                    <th className="py-2.5 px-4">COGS</th>
                    <th className="py-2.5 px-4">Gross Margin (Rs.)</th>
                    <th className="py-2.5 px-4">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {categoryProductData?.categories?.map((cat, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 font-medium">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{cat.categoryName}</td>
                      <td className="py-2.5 px-4">{cat.unitsSold} units</td>
                      <td className="py-2.5 px-4 font-bold">{formatPKR(cat.revenue)}</td>
                      <td className="py-2.5 px-4 text-slate-500">{formatPKR(cat.cogs)}</td>
                      <td className="py-2.5 px-4 font-bold text-emerald-700">+{formatPKR(cat.profit)}</td>
                      <td className="py-2.5 px-4 font-bold text-blue-600">{cat.marginPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Products Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm">Product Sales Ranking</h3>
              <p className="text-xs text-slate-500">Highest grossing items in catalog</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Rank</th>
                    <th className="py-2.5 px-4">Product Name</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Units Sold</th>
                    <th className="py-2.5 px-4">Total Revenue</th>
                    <th className="py-2.5 px-4">Gross Profit</th>
                    <th className="py-2.5 px-4">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {categoryProductData?.products?.map((prod, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 font-medium">
                      <td className="py-2.5 px-4 font-bold text-slate-400">#{idx + 1}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{prod.productName}</td>
                      <td className="py-2.5 px-4 text-slate-600">{prod.categoryName}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-800">{prod.unitsSold} units</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{formatPKR(prod.revenue)}</td>
                      <td className="py-2.5 px-4 font-bold text-emerald-700">+{formatPKR(prod.profit)}</td>
                      <td className="py-2.5 px-4 font-semibold text-blue-600">{prod.marginPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 14-Day Performance Trend */}
      {activeTab === 'trends' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-1">Daily Sales, COGS & Net Profit Trend</h3>
          <p className="text-xs text-slate-500 mb-4">Past 14 days tracking</p>

          <div className="space-y-3">
            {trendsData.map((t) => (
              <div key={t.date} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="w-28 font-bold text-slate-900">{t.date}</div>
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Revenue</span>
                    <span className="font-bold text-slate-900">{formatPKR(t.revenue)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">COGS</span>
                    <span className="font-medium text-slate-600">{formatPKR(t.cogs)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Expenses</span>
                    <span className="font-medium text-rose-600">{formatPKR(t.expenses)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Net Profit</span>
                    <span className={`font-bold ${t.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatPKR(t.netProfit)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

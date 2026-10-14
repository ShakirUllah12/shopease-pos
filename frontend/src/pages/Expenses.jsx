import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  Plus,
  Filter,
  Calendar,
  Trash2,
  X,
  DollarSign,
  Tag,
} from 'lucide-react';
import api from '../api/client';
import { useNotification } from '../context/NotificationContext';
import { formatPKR, formatDate, formatDateTime } from '../utils/formatters';

export default function Expenses() {
  const notify = useNotification();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Add Expense Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Miscellaneous');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/expenses?category=${selectedCategory}&startDate=${startDate}&endDate=${endDate}&limit=100`
      );
      if (res.data?.expenses) setExpenses(res.data.expenses);
      if (res.data?.categories) {
        setCategories(res.data.categories);
        if (!category && res.data.categories.length > 0) {
          setCategory(res.data.categories[0]);
        }
      }
      if (res.data?.totalAmount !== undefined) setTotalAmount(res.data.totalAmount);
    } catch (err) {
      notify.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedCategory, startDate, endDate]);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) {
      notify.error('Title and valid expense amount are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/expenses', {
        title: title.trim(),
        category,
        amount: Number(amount),
        date: expenseDate,
        notes: notes.trim(),
      });

      notify.success('Expense recorded successfully!');
      setIsModalOpen(false);
      setTitle('');
      setAmount('');
      setNotes('');
      fetchExpenses();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || 'Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;

    try {
      await api.delete(`/expenses/${id}`);
      notify.success('Expense deleted successfully');
      fetchExpenses();
    } catch (err) {
      notify.error('Failed to delete expense');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shop Expenses</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record and categorize overhead, rent, electricity, salaries, and operational costs
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Expense</span>
        </button>
      </div>

      {/* Aggregate Card & Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Expense in Filter Range */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Filtered Total</span>
            <div className="text-2xl font-black text-rose-600 mt-0.5">{formatPKR(totalAmount)}</div>
            <p className="text-xs text-slate-400 mt-0.5">{expenses.length} record{expenses.length === 1 ? '' : 's'}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Filters */}
        <div className="md:col-span-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[120px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
            />
          </div>

          <div className="flex-1 min-w-[120px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
            />
          </div>

          {(selectedCategory || startDate || endDate) && (
            <div className="self-end pb-0.5">
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 underline font-medium"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Title / Purpose</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Amount (PKR)</th>
                <th className="py-3 px-4">Logged By</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length > 0 ? (
                expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-600">{formatDate(exp.date)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{exp.title}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-rose-600">{formatPKR(exp.amount)}</td>
                    <td className="py-3 px-4 text-slate-500">{exp.createdByName || 'Owner'}</td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{exp.notes || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteExpense(exp._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Delete expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Record New Expense</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Title / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electricity Bill October, Store Rent, Lunch"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (Rs.) *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Date</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Additional Notes</label>
                <textarea
                  rows="2"
                  placeholder="Optional receipt # or details"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md shadow-brand-500/25"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

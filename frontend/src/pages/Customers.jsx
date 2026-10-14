import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Send,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  History,
  Receipt,
} from 'lucide-react';
import api from '../api/client';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { playSuccessTone, playErrorTone } from '../utils/soundEffects';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalReceivable, setTotalReceivable] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hasBalanceOnly, setHasBalanceOnly] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledgerHistory, setLedgerHistory] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Forms
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    creditLimit: 50000,
    openingBalance: 0,
    notes: '',
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'cash',
    referenceNumber: '',
    notes: '',
  });
  const [formError, setFormError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (hasBalanceOnly) params.hasBalance = 'true';

      const res = await api.get('/customers', { params });
      if (res.data.success) {
        setCustomers(res.data.customers || []);
        setTotalCount(res.data.totalCount || 0);
        setTotalReceivable(res.data.totalKhataReceivables || 0);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
  }, [search, hasBalanceOnly]);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await api.post('/customers', newCustomer);
      if (res.data.success) {
        playSuccessTone();
        setActionSuccess(`Customer ${res.data.customer.name} created successfully!`);
        setShowAddModal(false);
        setNewCustomer({
          name: '',
          phone: '',
          address: '',
          creditLimit: 50000,
          openingBalance: 0,
          notes: '',
        });
        fetchCustomers();
      }
    } catch (err) {
      playErrorTone();
      setFormError(err.response?.data?.message || 'Failed to create customer');
    }
  };

  const handleOpenPayment = (customer) => {
    setSelectedCustomer(customer);
    setPaymentForm({
      amount: customer.currentBalance > 0 ? customer.currentBalance : '',
      paymentMethod: 'cash',
      referenceNumber: '',
      notes: '',
    });
    setFormError('');
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setFormError('');
    try {
      const res = await api.post(`/customers/${selectedCustomer._id}/payments`, paymentForm);
      if (res.data.success) {
        playSuccessTone();
        setActionSuccess(res.data.message);
        setShowPaymentModal(false);
        fetchCustomers();
      }
    } catch (err) {
      playErrorTone();
      setFormError(err.response?.data?.message || 'Failed to record repayment');
    }
  };

  const handleOpenLedger = async (customer) => {
    setSelectedCustomer(customer);
    setShowLedgerModal(true);
    setLoadingLedger(true);
    try {
      const res = await api.get(`/customers/${customer._id}`);
      if (res.data.success) {
        setLedgerHistory(res.data.ledger || []);
      }
    } catch (err) {
      console.error('Error fetching ledger:', err);
    } finally {
      setLoadingLedger(false);
    }
  };

  const sendWhatsAppReminder = (customer) => {
    const message = `Assalam-o-Alaikum ${customer.name},\nThis is a friendly reminder regarding your outstanding Khata balance of *Rs. ${customer.currentBalance.toLocaleString()}* at *ShopEase POS*.\nPlease clear the balance at your earliest convenience.\nThank you!`;
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="h-7 w-7 text-primary-600" />
            Customers & Khata Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage customer store credit, track Udhaar accounts, and log repayments
          </p>
        </div>

        <button
          onClick={() => {
            setFormError('');
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add New Customer
        </button>
      </div>

      {/* Action Notification */}
      {actionSuccess && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Khata Receivables (Udhaar)
          </div>
          <div className="mt-2 text-2xl font-black text-red-600 dark:text-red-400">
            {formatCurrency(totalReceivable)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Total amount owed to the store</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Active Registered Customers
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            {totalCount.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Customers with regular accounts</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Accounts with Pending Balance
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
            {customers.filter((c) => c.currentBalance > 0).length}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Customers currently on credit</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl bg-white p-4 border border-slate-200/80 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={hasBalanceOnly}
              onChange={(e) => setHasBalanceOnly(e.target.checked)}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            Only Show Customers with Balance &gt; 0
          </label>
        </div>
      </div>

      {/* Customer List Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
            <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">No customers found</h3>
            <p className="mt-1 text-xs text-slate-500">
              {search ? 'Try adjusting your search criteria' : 'Create your first customer account to begin tracking Khata.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Contact & Location</th>
                  <th className="px-5 py-3.5">Credit Limit</th>
                  <th className="px-5 py-3.5">Khata Balance</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{c.name}</div>
                      {c.notes && <div className="text-[11px] text-slate-400 truncate max-w-xs">{c.notes}</div>}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-mono">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {c.phone}
                      </div>
                      {c.address && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-xs">{c.address}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 font-mono font-medium text-slate-600 dark:text-slate-400">
                      {formatCurrency(c.creditLimit || 50000)}
                    </td>

                    <td className="px-5 py-4">
                      {c.currentBalance > 0 ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 font-bold border border-red-200 dark:border-red-900">
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          {formatCurrency(c.currentBalance)}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 font-medium text-[11px]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Clear (Rs. 0)
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.currentBalance > 0 && (
                          <>
                            <button
                              onClick={() => handleOpenPayment(c)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm transition-colors"
                              title="Receive Cash/Digital Payment"
                            >
                              <DollarSign className="h-3.5 w-3.5" />
                              Pay
                            </button>

                            <button
                              onClick={() => sendWhatsAppReminder(c)}
                              className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 transition-colors"
                              title="Send WhatsApp Khata Reminder"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleOpenLedger(c)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <History className="h-3.5 w-3.5 text-slate-500" />
                          Ledger
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add New Customer */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-600" />
                Add New Customer Account
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 text-xs rounded-xl bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mehmood"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile / WhatsApp Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 03001234567"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Store Credit Limit (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newCustomer.creditLimit}
                  onChange={(e) => setNewCustomer({ ...newCustomer, creditLimit: Number(e.target.value) })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Previous / Opening Udhaar Balance (if any)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newCustomer.openingBalance}
                  onChange={(e) => setNewCustomer({ ...newCustomer, openingBalance: Number(e.target.value) })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Address / City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shop # 4, Main Bazar"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Payment Received */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  Receive Khata Repayment
                </h3>
                <p className="text-xs text-slate-500">{selectedCustomer.name}</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 text-xs rounded-xl bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                  {formError}
                </div>
              )}

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 flex justify-between items-center text-xs">
                <span className="text-slate-500">Current Outstanding Balance:</span>
                <span className="font-black text-red-600 text-sm">
                  {formatCurrency(selectedCustomer.currentBalance)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount (PKR) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedCustomer.currentBalance}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full text-base font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="cash">Cash in Hand</option>
                  <option value="raast">Raast Instant Transfer</option>
                  <option value="jazzcash">JazzCash</option>
                  <option value="easypaisa">EasyPaisa</option>
                  <option value="bank">Bank Transfer / 1Link</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reference # (Slip / TID / Cheque)
                </label>
                <input
                  type="text"
                  placeholder="Optional reference number"
                  value={paymentForm.referenceNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
                >
                  Confirm Repayment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detailed Customer Ledger */}
      {showLedgerModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <History className="h-5 w-5 text-primary-600" />
                  Account Ledger: {selectedCustomer.name}
                </h3>
                <p className="text-xs text-slate-500">Phone: {selectedCustomer.phone}</p>
              </div>
              <button
                onClick={() => setShowLedgerModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                  <span className="text-slate-400">Current Outstanding:</span>
                  <div className="text-lg font-black text-red-600 mt-1">
                    {formatCurrency(selectedCustomer.currentBalance)}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                  <span className="text-slate-400">Credit Limit:</span>
                  <div className="text-lg font-black text-slate-700 dark:text-slate-200 mt-1">
                    {formatCurrency(selectedCustomer.creditLimit || 50000)}
                  </div>
                </div>
              </div>

              {loadingLedger ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading ledger records...</div>
              ) : ledgerHistory.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No transactions recorded yet.</div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-850 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Type & Ref</th>
                        <th className="p-2.5 text-right">Debit (+)</th>
                        <th className="p-2.5 text-right">Credit (-)</th>
                        <th className="p-2.5 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {ledgerHistory.map((item) => (
                        <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                          <td className="p-2.5 text-slate-500 whitespace-nowrap">
                            {formatDateTime(item.createdAt)}
                          </td>
                          <td className="p-2.5">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {item.type.replace('_', ' ')}
                            </span>
                            {item.receiptNumber && (
                              <span className="text-[10px] text-slate-400 block font-mono">
                                Receipt: {item.receiptNumber}
                              </span>
                            )}
                            {item.description && (
                              <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                                {item.description}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-red-600">
                            {item.type === 'SALE_CREDIT' || item.type === 'OPENING_BALANCE'
                              ? `+${formatCurrency(item.amount)}`
                              : '-'}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                            {item.type === 'PAYMENT_RECEIVED' ? `-${formatCurrency(item.amount)}` : '-'}
                          </td>
                          <td className="p-2.5 text-right font-mono font-black text-slate-900 dark:text-slate-100">
                            {formatCurrency(item.newBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

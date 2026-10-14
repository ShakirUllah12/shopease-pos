import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  CheckCircle2,
  AlertCircle,
  Eye,
  DollarSign,
  UserCheck,
  Building,
  Phone,
  X,
  FileCheck,
} from 'lucide-react';
import api from '../api/client';
import { useNotification } from '../context/NotificationContext';
import { formatPKR, formatDate, formatDateTime } from '../utils/formatters';

export default function Purchases() {
  const notify = useNotification();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'suppliers'

  // Purchases list state
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Purchase Modal State
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [purchaseStatus, setPurchaseStatus] = useState('received'); // 'received' increases stock immediately!
  const [amountPaidInitial, setAmountPaidInitial] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([
    { variantId: '', quantity: 1, unitCost: '' },
  ]);

  // New Supplier Modal State
  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');

  // Record Payment Modal State
  const [payingPurchase, setPayingPurchase] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  // View Purchase Details Modal
  const [viewingPurchase, setViewingPurchase] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPurchasesAndSuppliers = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, prodRes] = await Promise.all([
        api.get('/purchases?limit=100'),
        api.get('/suppliers'),
        api.get('/products?isActive=true&limit=100'),
      ]);

      if (pRes.data?.purchases) setPurchases(pRes.data.purchases);
      if (sRes.data?.suppliers) {
        setSuppliers(sRes.data.suppliers);
        if (!selectedSupplierId && sRes.data.suppliers.length > 0) {
          setSelectedSupplierId(sRes.data.suppliers[0]._id);
        }
      }
      if (prodRes.data?.products) setProducts(prodRes.data.products);
    } catch (err) {
      notify.error('Failed to load purchases or suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchasesAndSuppliers();
  }, []);

  // Variant options flattener for item selector
  const allVariants = products.flatMap((p) =>
    (p.variants || []).map((v) => ({
      variantId: v._id,
      label: `${p.name} — ${v.variantName || [v.color, v.size].filter(Boolean).join('/') || 'Default'} (${v.sku})`,
      costPrice: v.costPrice,
    }))
  );

  // Add Item row to Purchase Form
  const handleAddItemRow = () => {
    setPurchaseItems((prev) => [
      ...prev,
      { variantId: allVariants[0]?.variantId || '', quantity: 1, unitCost: allVariants[0]?.costPrice || '' },
    ]);
  };

  const handleRemoveItemRow = (idx) => {
    setPurchaseItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, value) => {
    setPurchaseItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };

      if (field === 'variantId') {
        const found = allVariants.find((av) => av.variantId === value);
        if (found) {
          updated[idx].unitCost = found.costPrice;
        }
      }
      return updated;
    });
  };

  // Submit New Purchase
  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      notify.error('Please select a supplier');
      return;
    }

    if (purchaseItems.length === 0 || !purchaseItems[0].variantId) {
      notify.error('Please add at least one valid product variant item');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/purchases', {
        supplierId: selectedSupplierId,
        status: purchaseStatus,
        amountPaid: Number(amountPaidInitial) || 0,
        notes: purchaseNotes,
        items: purchaseItems.map((it) => ({
          variantId: it.variantId,
          quantity: Number(it.quantity) || 1,
          unitCost: Number(it.unitCost) || 0,
        })),
      });

      notify.success(res.data?.message || 'Purchase order created successfully!');
      setIsNewPurchaseOpen(false);
      fetchPurchasesAndSuppliers();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || 'Failed to create purchase');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mark Purchase as Received
  const handleMarkReceived = async (purchase) => {
    try {
      const res = await api.patch(`/purchases/${purchase._id}/receive`);
      notify.success(res.data?.message || 'Purchase marked received and stock increased!');
      fetchPurchasesAndSuppliers();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || 'Failed to receive goods');
    }
  };

  // Submit Supplier
  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    if (!supplierName.trim() || !supplierPhone.trim()) {
      notify.error('Supplier name and contact phone are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/suppliers', {
        name: supplierName.trim(),
        companyName: companyName.trim(),
        phone: supplierPhone.trim(),
        email: supplierEmail.trim(),
        address: supplierAddress.trim(),
      });

      notify.success('Supplier added successfully!');
      setIsNewSupplierOpen(false);
      setSupplierName('');
      setCompanyName('');
      setSupplierPhone('');
      setSupplierEmail('');
      setSupplierAddress('');
      fetchPurchasesAndSuppliers();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || 'Failed to add supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Payment Against Purchase
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) {
      notify.error('Please enter a valid payment amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/purchases/${payingPurchase._id}/payment`, {
        amount: amt,
      });

      notify.success('Payment recorded successfully!');
      setPayingPurchase(null);
      setPaymentAmount('');
      fetchPurchasesAndSuppliers();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Suppliers & Purchases</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Procure inventory, receive shipments to increase stock, and track balances
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewSupplierOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Building className="w-3.5 h-3.5" />
            <span>New Supplier</span>
          </button>
          <button
            onClick={() => setIsNewPurchaseOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'orders'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Purchase Orders ({purchases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'suppliers'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Registered Suppliers ({suppliers.length})</span>
        </button>
      </div>

      {/* TAB 1: Purchases List */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Goods Status</th>
                  <th className="py-3 px-4">Total Cost</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Balance Due</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {purchases.length > 0 ? (
                  purchases.map((p) => {
                    const balance = Math.max(0, p.totalAmount - (p.amountPaid || 0));
                    const isReceived = p.status === 'received';

                    return (
                      <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.purchaseNumber}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{p.supplierName}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                              isReceived
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isReceived && <CheckCircle2 className="w-3 h-3" />}
                            <span>{p.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{formatPKR(p.totalAmount)}</td>
                        <td className="py-3 px-4 text-slate-600">{formatPKR(p.amountPaid)}</td>
                        <td className="py-3 px-4">
                          <span className={`font-bold ${balance > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            {formatPKR(balance)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              p.paymentStatus === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.paymentStatus === 'partial'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {p.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isReceived && (
                              <button
                                onClick={() => handleMarkReceived(p)}
                                title="Mark Goods as Received (Increases Stock)"
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Receive</span>
                              </button>
                            )}

                            {balance > 0 && (
                              <button
                                onClick={() => {
                                  setPayingPurchase(p);
                                  setPaymentAmount(balance.toString());
                                }}
                                title="Pay Supplier"
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-xs border border-slate-300"
                              >
                                Pay
                              </button>
                            )}

                            <button
                              onClick={() => setViewingPurchase(p)}
                              title="View Items & Details"
                              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      No purchase orders recorded yet. Click "Create Purchase Order" above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Suppliers Directory */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((sup) => (
            <div key={sup._id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-slate-900 text-sm">{sup.name}</h3>
                  <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-100">
                    Supplier
                  </span>
                </div>
                {sup.companyName && (
                  <p className="text-xs text-brand-700 font-semibold">{sup.companyName}</p>
                )}

                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sup.phone}</span>
                  </div>
                  {sup.address && (
                    <p className="text-slate-500 text-[11px] mt-1 truncate">{sup.address}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Outstanding Balance:</span>
                  <span className={`font-black ${sup.outstandingBalance > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                    {formatPKR(sup.outstandingBalance)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Total Orders:</span>
                  <span className="font-bold text-slate-800">{sup.totalPurchases || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE PURCHASE MODAL */}
      {isNewPurchaseOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">New Purchase Order</h3>
                <p className="text-xs text-slate-500">Record supplier procurement and goods arrival</p>
              </div>
              <button
                onClick={() => setIsNewPurchaseOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Supplier *</label>
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                  >
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} {s.companyName ? `(${s.companyName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Receipt Status *</label>
                  <select
                    value={purchaseStatus}
                    onChange={(e) => setPurchaseStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="received">Received (Increases stock immediately)</option>
                    <option value="ordered">Ordered (Stock updates when received)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount Paid Initial (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={amountPaidInitial}
                    onChange={(e) => setAmountPaidInitial(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Notes / Invoice Ref</label>
                  <input
                    type="text"
                    placeholder="Supplier bill# or shipment tracking"
                    value={purchaseNotes}
                    onChange={(e) => setPurchaseNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Procurement Items
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-300 rounded-lg font-bold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {purchaseItems.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                      <div className="flex-1">
                        <select
                          required
                          value={item.variantId}
                          onChange={(e) => handleItemChange(idx, 'variantId', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none"
                        >
                          <option value="">-- Choose Variant --</option>
                          {allVariants.map((av) => (
                            <option key={av.variantId} value={av.variantId}>
                              {av.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center focus:outline-none"
                        />
                      </div>

                      <div className="w-28 relative">
                        <span className="absolute left-2 top-1.5 text-slate-400">Rs.</span>
                        <input
                          type="number"
                          min="0"
                          required
                          placeholder="Cost"
                          value={item.unitCost}
                          onChange={(e) => handleItemChange(idx, 'unitCost', e.target.value)}
                          className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none"
                        />
                      </div>

                      {purchaseItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewPurchaseOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md shadow-brand-500/25 transition-all"
                >
                  {isSubmitting ? 'Recording...' : 'Create Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SUPPLIER MODAL */}
      {isNewSupplierOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Add New Supplier</h3>
              <button
                onClick={() => setIsNewSupplierOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asif Textile Importers"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Business Name</label>
                <input
                  type="text"
                  placeholder="e.g. Faisalabad Fabric Mill"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone *</label>
                <input
                  type="text"
                  required
                  placeholder="0300 1234567"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="supplier@company.com"
                  value={supplierEmail}
                  onChange={(e) => setSupplierEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Commercial Market, Karachi / Lahore"
                  value={supplierAddress}
                  onChange={(e) => setSupplierAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewSupplierOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md shadow-brand-500/25 transition-all"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {payingPurchase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Record Supplier Payment</h3>
                <p className="text-xs text-slate-500">PO: {payingPurchase.purchaseNumber}</p>
              </div>
              <button
                onClick={() => setPayingPurchase(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Total Amount:</span>
                  <span className="font-bold text-slate-900">{formatPKR(payingPurchase.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Already Paid:</span>
                  <span className="font-semibold">{formatPKR(payingPurchase.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold border-t border-slate-200 pt-1">
                  <span>Balance Due:</span>
                  <span>{formatPKR(payingPurchase.totalAmount - payingPurchase.amountPaid)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Amount (Rs.) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayingPurchase(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md shadow-brand-500/25"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PURCHASE DETAILS MODAL */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Purchase Order Details</h3>
                <p className="text-xs text-slate-500">{viewingPurchase.purchaseNumber}</p>
              </div>
              <button
                onClick={() => setViewingPurchase(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplier:</span>
                  <span className="font-bold text-slate-900">{viewingPurchase.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Goods Status:</span>
                  <span className="font-semibold uppercase">{viewingPurchase.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span>{formatDateTime(viewingPurchase.createdAt, true)}</span>
                </div>
                {viewingPurchase.notes && (
                  <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                    <span>Notes:</span>
                    <span>{viewingPurchase.notes}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  Items Purchased ({viewingPurchase.items?.length || 0})
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {viewingPurchase.items?.map((it, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{it.productName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {[it.color, it.size].filter(Boolean).join('/')} • SKU: {it.sku}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">{formatPKR(it.lineTotal)}</div>
                        <div className="text-slate-400 text-[10px]">
                          {it.quantity} x {formatPKR(it.unitCost, false)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 text-white p-3 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-300">Total PO Amount:</span>
                  <span className="font-bold">{formatPKR(viewingPurchase.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Amount Paid:</span>
                  <span>{formatPKR(viewingPurchase.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-rose-400 font-bold border-t border-slate-700 pt-1">
                  <span>Remaining Due:</span>
                  <span>{formatPKR(viewingPurchase.totalAmount - viewingPurchase.amountPaid)}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingPurchase(null)}
                className="px-4 py-1.5 border border-slate-300 bg-white text-slate-700 font-semibold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
  CheckCircle2,
  Tag,
  Percent,
  X,
  AlertCircle,
  Sparkles,
  Camera,
  QrCode,
  Users,
  Package,
} from 'lucide-react';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { formatPKR } from '../utils/formatters';
import { playBeep, playSuccessTone, playErrorTone } from '../utils/soundEffects';
import VariantSelectorModal from '../components/VariantSelectorModal';
import PrintReceiptModal from '../components/PrintReceiptModal';
import CameraBarcodeScanner from '../components/CameraBarcodeScanner';
import PaymentQRCodeModal from '../components/PaymentQRCodeModal';

export default function POS() {
  const {
    items: cartItems,
    addToCart,
    updateQuantity,
    updateItemDiscount,
    removeFromCart,
    clearCart,
    orderDiscount,
    setOrderDiscount,
    subtotal,
    taxAmount,
    totalAmount,
    totalItemCount,
  } = useCart();

  const notify = useNotification();

  // Search & Catalog state
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [categories, setCategories] = useState([]);

  // Barcode and Scanner Modals
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickCategory, setQuickCategory] = useState('');
  const [quickPrice, setQuickPrice] = useState('');
  const [quickCost, setQuickCost] = useState('');
  const [quickStock, setQuickStock] = useState('10');
  const [quickBarcode, setQuickBarcode] = useState('');
  const [isSubmittingQuickProduct, setIsSubmittingQuickProduct] = useState(false);

  // Variant modal state for Clothing
  const [activeProductForVariants, setActiveProductForVariants] = useState(null);

  // Customers for Khata / Store Credit
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [payments, setPayments] = useState([
    { method: 'cash', amount: '', referenceNumber: '' },
  ]);
  const [cashTendered, setCashTendered] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  // Completed sale receipt modal
  const [completedSale, setCompletedSale] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);

  const searchInputRef = useRef(null);

  // Fetch categories, store settings, and registered customers
  useEffect(() => {
    async function initData() {
      try {
        const [cats, settings, custs] = await Promise.all([
          api.get('/categories'),
          api.get('/settings'),
          api.get('/customers?limit=100'),
        ]);
        if (cats.data?.categories) setCategories(cats.data.categories);
        if (settings.data?.settings) setStoreSettings(settings.data.settings);
        if (custs.data?.customers) setCustomers(custs.data.customers);
      } catch (err) {
        // Silent fail
      }
    }
    initData();
  }, []);

  // Barcode scan handler (called by camera scanner or hardware USB scanner)
  const handleScanBarcode = async (scannedCode) => {
    if (!scannedCode || !scannedCode.trim()) return;
    const term = scannedCode.trim();

    try {
      const res = await api.get(`/products/pos-search?query=${encodeURIComponent(term)}`);
      if (res.data?.products && res.data.products.length > 0) {
        for (const p of res.data.products) {
          const matchedVariant = p.variants?.find(
            (v) =>
              (v.sku && v.sku.toLowerCase() === term.toLowerCase()) ||
              (v.barcode && v.barcode.toLowerCase() === term.toLowerCase())
          );
          if (matchedVariant) {
            playBeep();
            addToCart(p, matchedVariant, 1);
            notify.success(`Scanned: ${p.name} (${matchedVariant.variantName || matchedVariant.sku})`, 1500);
            return;
          }
        }
        const firstProd = res.data.products[0];
        const firstVar = firstProd.variants?.[0];
        if (firstVar) {
          playBeep();
          addToCart(firstProd, firstVar, 1);
          notify.success(`Added: ${firstProd.name}`, 1500);
          return;
        }
      }
      playErrorTone();
      notify.warning(`No product found matching barcode "${term}"`);
    } catch (err) {
      playErrorTone();
      notify.error('Scanner error: ' + err.message);
    }
  };

  // Global Hardware USB / Bluetooth Barcode Scanner listener (<100ms rapid keystroke burst)
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInput = activeTag === 'input' || activeTag === 'textarea';

      const now = Date.now();
      const diff = now - lastKeyTime;
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (buffer.length >= 3 && diff < 120) {
          e.preventDefault();
          handleScanBarcode(buffer);
          buffer = '';
        } else {
          buffer = '';
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (diff > 120 && !isInput) {
          buffer = e.key;
        } else if (diff <= 120) {
          buffer += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  // Search products
  useEffect(() => {
    let cancel = false;
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await api.get(`/products/pos-search?query=${encodeURIComponent(searchQuery)}`);
        if (!cancel && res.data?.products) {
          setProducts(res.data.products);
        }
      } catch (err) {
        if (!cancel) notify.error('Failed to search catalog');
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    const timer = setTimeout(fetchProducts, 200);
    return () => {
      cancel = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Filter products by category tab
  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'CLOTHING') return p.isClothing;
    if (selectedCategory === 'GENERAL_STORE') return !p.isClothing;
    return p.categoryId?._id === selectedCategory || p.categoryId === selectedCategory;
  });

  // Handle clicking a product from POS grid
  const handleProductClick = (product) => {
    // If it's a clothing product with multiple variants, open variant selector modal
    if (product.isClothing && product.variants && product.variants.length > 1) {
      setActiveProductForVariants(product);
      return;
    }

    // Single variant or default variant (General Store)
    const variant = product.variants && product.variants[0];
    if (!variant) {
      notify.error('No variant found for this product');
      return;
    }

    try {
      addToCart(product, variant, 1);
      notify.success(`Added ${product.name} to cart`, 1500);
    } catch (err) {
      notify.error(err.message);
    }
  };

  const handleSelectVariantFromModal = (variant) => {
    try {
      addToCart(activeProductForVariants, variant, 1);
      notify.success(`Added ${activeProductForVariants.name} (${variant.variantName})`, 1500);
      setActiveProductForVariants(null);
    } catch (err) {
      notify.error(err.message);
    }
  };

  // Handle Quick Add Product from POS Terminal
  const handleQuickAddProduct = async (e) => {
    e.preventDefault();
    if (!quickName.trim()) {
      notify.error('Product title is required');
      return;
    }
    if (!quickPrice || Number(quickPrice) <= 0) {
      notify.error('Selling price must be greater than 0');
      return;
    }

    setIsSubmittingQuickProduct(true);
    try {
      const catId = quickCategory || (categories[0]?._id);
      const generatedSku = 'SKU-' + Math.floor(1000 + Math.random() * 9000);
      const payload = {
        name: quickName.trim(),
        categoryId: catId,
        isClothing: false,
        trackStock: true,
        variants: [
          {
            sku: generatedSku,
            variantName: 'Default',
            sellingPrice: Number(quickPrice),
            costPrice: Number(quickCost) || 0,
            initialStock: Number(quickStock) || 0,
            minStockAlert: 2,
            barcode: (quickBarcode || '').trim(),
          },
        ],
      };

      const res = await api.post('/products', payload);
      if (res.data?.success) {
        notify.success(`Product "${quickName}" added to catalog!`);
        playSuccessTone();
        // Reset quick add form
        setQuickName('');
        setQuickPrice('');
        setQuickCost('');
        setQuickStock('10');
        setQuickBarcode('');
        setIsQuickAddOpen(false);

        // Refresh products list
        const refreshRes = await api.get(`/products/pos-search?query=${encodeURIComponent(searchQuery)}`);
        if (refreshRes.data?.products) {
          setProducts(refreshRes.data.products);
        }
      }
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || 'Failed to add product');
    } finally {
      setIsSubmittingQuickProduct(false);
    }
  };

  // Open checkout modal & prep default payment amount to match totalAmount
  const handleOpenCheckout = () => {
    if (cartItems.length === 0) {
      notify.warning('Your cart is empty. Please add items first.');
      return;
    }
    setPayments([
      { method: 'cash', amount: totalAmount.toString(), referenceNumber: '' },
    ]);
    setCashTendered(totalAmount.toString());
    setIsCheckoutOpen(true);
  };

  // Payment row manipulation
  const handleAddPaymentRow = () => {
    setPayments((prev) => [...prev, { method: 'card', amount: '', referenceNumber: '' }]);
  };

  const handleRemovePaymentRow = (index) => {
    setPayments((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePaymentChange = (index, field, value) => {
    setPayments((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Calculate sum of payments & change
  const totalPaymentSum = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const paymentRemaining = Math.max(0, Math.round((totalAmount - totalPaymentSum) * 100) / 100);
  const changeToReturn =
    totalPaymentSum > totalAmount ? Math.round((totalPaymentSum - totalAmount) * 100) / 100 : 0;

  // Submit sale to backend
  const handleCompleteSale = async () => {
    if (totalPaymentSum < totalAmount) {
      notify.error(`Remaining balance of ${formatPKR(paymentRemaining)} is unpaid.`);
      return;
    }

    setIsSubmittingSale(true);
    try {
      const payload = {
        items: cartItems.map((it) => ({
          variantId: it.variantId,
          quantity: it.quantity,
          discount: it.discount || 0,
        })),
        orderDiscount,
        customerId: selectedCustomerId || undefined,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim(),
        payments: payments.map((p) => ({
          method: p.method,
          amount: Number(p.amount),
          referenceNumber: p.referenceNumber,
        })),
        notes,
      };

      const res = await api.post('/sales', payload);
      if (res.data?.success) {
        notify.success('Sale completed successfully!');
        setCompletedSale(res.data.sale);
        clearCart();
        setIsCheckoutOpen(false);
      }
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || 'Failed to complete sale');
    } finally {
      setIsSubmittingSale(false);
    }
  };

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col lg:flex-row gap-4 overflow-hidden">
      {/* LEFT: Product Catalog & Search (60%) */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search product name, SKU, or scan barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-brand-500 shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsCameraScannerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
              title="Scan Barcode via Camera"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Camera Scan</span>
            </button>

            <button
              type="button"
              onClick={() => setIsQuickAddOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
              title="Quickly add new shop product (نیا پروڈکٹ درج کریں)"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Product</span>
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat._id;
              return (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredProducts.map((p) => {
                const totalStock = p.variants?.reduce((sum, v) => sum + (v.currentStock || 0), 0) || 0;
                const isOutOfStock = p.trackStock && totalStock <= 0;
                const hasMultipleVariants = p.isClothing && p.variants && p.variants.length > 1;
                const displayPrice = p.variants?.[0]?.sellingPrice || 0;

                return (
                  <div
                    key={p._id}
                    onClick={() => handleProductClick(p)}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all select-none cursor-pointer group ${
                      isOutOfStock
                        ? 'border-slate-200 bg-slate-50 opacity-60'
                        : 'border-slate-200 bg-white hover:border-brand-500 hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                          {p.categoryName || (p.isClothing ? 'Clothing' : 'General')}
                        </span>
                        {hasMultipleVariants && (
                          <span className="text-[9px] font-bold px-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {p.variants.length} sizes
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs line-clamp-2 group-hover:text-brand-600 transition-colors">
                        {p.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {formatPKR(displayPrice)}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          isOutOfStock ? 'text-rose-600' : 'text-slate-400'
                        }`}
                      >
                        {isOutOfStock ? 'Sold Out' : `${totalStock} in stock`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
              <p>No products match your search query.</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart & Checkout Summary (40%) */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-sm">Current Order</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
              {totalItemCount} items
            </span>
          </div>

          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-3 overflow-y-auto divide-y divide-slate-100 space-y-2">
          {cartItems.length > 0 ? (
            cartItems.map((item) => {
              const variantDesc = [item.color, item.size].filter(Boolean).join(' / ');

              return (
                <div key={item.variantId} className="pt-2 first:pt-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="truncate">
                      <h4 className="font-bold text-slate-800 text-xs truncate">
                        {item.productName}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {variantDesc && <span className="font-semibold text-slate-700">{variantDesc} • </span>}
                        {item.sku}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.variantId)}
                      className="text-slate-400 hover:text-rose-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    {/* Quantity Stepper */}
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="p-1 hover:bg-slate-200 text-slate-600 rounded-l-lg"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.variantId, e.target.value)}
                        className="w-10 text-center text-xs font-bold bg-transparent focus:outline-none"
                      />
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        className="p-1 hover:bg-slate-200 text-slate-600 rounded-r-lg"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="text-right">
                      <div className="font-extrabold text-slate-900 text-xs">
                        {formatPKR(item.lineTotal)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.quantity} x {formatPKR(item.unitPrice, false)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs">
              <ShoppingCart className="w-8 h-8 mb-2 opacity-40" />
              <p>Your cart is empty.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Click products on the left to add items.</p>
            </div>
          )}
        </div>

        {/* Subtotal & Discount Calculation Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-900">{formatPKR(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Order Discount (Rs.):</span>
            </span>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={orderDiscount || ''}
              onChange={(e) => setOrderDiscount(Math.max(0, Number(e.target.value) || 0))}
              className="w-20 px-2 py-0.5 text-right font-bold bg-white border border-slate-300 rounded-md focus:outline-none focus:border-brand-500"
            />
          </div>

          {taxAmount > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Tax / GST:</span>
              <span className="font-semibold text-slate-900">{formatPKR(taxAmount)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
            <span className="text-sm font-black text-slate-900 uppercase">Grand Total:</span>
            <span className="text-xl font-black text-brand-600">{formatPKR(totalAmount)}</span>
          </div>

          <button
            onClick={handleOpenCheckout}
            disabled={cartItems.length === 0}
            className="w-full mt-2 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 transition-all"
          >
            <Banknote className="w-4 h-4" />
            <span>Proceed to Checkout</span>
          </button>
        </div>
      </div>

      {/* Variant Selector Modal for Clothing */}
      {activeProductForVariants && (
        <VariantSelectorModal
          product={activeProductForVariants}
          onClose={() => setActiveProductForVariants(null)}
          onSelectVariant={handleSelectVariantFromModal}
        />
      )}

      {/* Checkout & Split Payment Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Payment & Complete Sale</h3>
                <p className="text-xs text-slate-500">Total payable: <strong className="text-brand-600 text-sm">{formatPKR(totalAmount)}</strong></p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Customer Information & Khata Account */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-primary-600" />
                    Customer Account (Optional / Khata)
                  </label>
                  {selectedCustomerId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId('');
                        setCustomerName('');
                        setCustomerPhone('');
                      }}
                      className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                    >
                      Clear / Walk-in
                    </button>
                  )}
                </div>

                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    setSelectedCustomerId(cId);
                    const found = customers.find((c) => c._id === cId);
                    if (found) {
                      setCustomerName(found.name);
                      setCustomerPhone(found.phone);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none"
                >
                  <option value="">-- Select Registered Khata Customer (or type below) --</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.phone}) {c.currentBalance > 0 ? `• Udhaar: Rs. ${c.currentBalance.toLocaleString()}` : ''}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Name</label>
                    <input
                      type="text"
                      placeholder="Walk-in Customer"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Phone</label>
                    <input
                      type="text"
                      placeholder="0300 1234567"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payments Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Payment Method(s) & Split
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsQRModalOpen(true)}
                      className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                      title="Show Raast / JazzCash / EasyPaisa QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Digital QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddPaymentRow}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Split</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {payments.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <select
                        value={p.method}
                        onChange={(e) => handlePaymentChange(idx, 'method', e.target.value)}
                        className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-xs focus:outline-none"
                      >
                        <option value="cash">Cash in Hand</option>
                        <option value="card">Card (POS Terminal)</option>
                        <option value="raast">Raast Instant Payment</option>
                        <option value="jazzcash">JazzCash</option>
                        <option value="easypaisa">EasyPaisa</option>
                        <option value="bank_transfer">Bank Transfer / 1Link</option>
                        <option value="credit">Store Credit / Khata (Udhaar)</option>
                        <option value="other">Other</option>
                      </select>

                      <div className="flex-1 relative">
                        <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold">Rs.</span>
                        <input
                          type="number"
                          placeholder="Amount"
                          value={p.amount}
                          onChange={(e) => handlePaymentChange(idx, 'amount', e.target.value)}
                          className="w-full pl-9 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:border-brand-500"
                        />
                      </div>

                      {p.method !== 'cash' && (
                        <input
                          type="text"
                          placeholder="Ref / Slip #"
                          value={p.referenceNumber}
                          onChange={(e) => handlePaymentChange(idx, 'referenceNumber', e.target.value)}
                          className="w-24 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      )}

                      {payments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePaymentRow(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cash Change Calculator */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Total Amount Due:</span>
                  <span className="font-bold text-white">{formatPKR(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Total Amount Tendered:</span>
                  <span className="font-bold text-white">{formatPKR(totalPaymentSum)}</span>
                </div>

                {changeToReturn > 0 ? (
                  <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-emerald-400 font-extrabold text-sm">
                    <span>Change to Return:</span>
                    <span className="text-base">{formatPKR(changeToReturn)}</span>
                  </div>
                ) : paymentRemaining > 0 ? (
                  <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-rose-400 font-bold text-xs">
                    <span>Remaining to Collect:</span>
                    <span>{formatPKR(paymentRemaining)}</span>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-700 flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Exact amount received. Ready to finalize!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl"
              >
                Back to Cart
              </button>
              <button
                type="button"
                disabled={isSubmittingSale || paymentRemaining > 0}
                onClick={handleCompleteSale}
                className="inline-flex items-center gap-2 px-6 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md shadow-brand-500/25 transition-all"
              >
                {isSubmittingSale ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Print Receipt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Barcode Scanner Modal */}
      <CameraBarcodeScanner
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={(code) => handleScanBarcode(code)}
        title="Scan Product Barcode"
      />

      {/* Dynamic Digital Payment QR Code Modal */}
      <PaymentQRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        amount={paymentRemaining > 0 ? paymentRemaining : totalAmount}
        saleNumber={`POS-${Date.now().toString().slice(-6)}`}
        settings={storeSettings || {}}
        onConfirmPayment={({ method, amount, referenceNumber }) => {
          playSuccessTone();
          setPayments((prev) => [
            ...prev.filter((p) => p.amount && Number(p.amount) > 0),
            { method, amount: amount.toString(), referenceNumber },
          ]);
          notify.success(`Received ${formatPKR(amount)} via ${method.toUpperCase()} QR!`);
        }}
      />

      {/* Thermal Receipt Print Preview Modal on Sale Completion */}
      {completedSale && (
        <PrintReceiptModal
          sale={completedSale}
          storeSettings={storeSettings}
          onClose={() => setCompletedSale(null)}
        />
      )}

      {/* Quick Add Product Modal */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Quick Add New Product</h3>
                  <p className="text-[11px] text-slate-500">نیا پروڈکٹ درج کریں (دکان میں فوری فروخت کیلئے)</p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickAddOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddProduct} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Product Name / Title * (پروڈکٹ کا نام)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Polo T-Shirt, Cooking Oil 1L, etc."
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Category (شعبہ)
                  </label>
                  <select
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Barcode (اختیاری)
                  </label>
                  <input
                    type="text"
                    placeholder="Scan / Type Barcode"
                    value={quickBarcode}
                    onChange={(e) => setQuickBarcode(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sale Price (فروخت) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Rs."
                    value={quickPrice}
                    onChange={(e) => setQuickPrice(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none font-bold text-brand-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cost Price (خرید)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Rs."
                    value={quickCost}
                    onChange={(e) => setQuickCost(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none text-slate-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Stock (تعداد)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Qty"
                    value={quickStock}
                    onChange={(e) => setQuickStock(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuickProduct}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-brand-500/25 transition-all"
                >
                  {isSubmittingQuickProduct ? 'Saving...' : 'Save Product & Ready to Sell'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

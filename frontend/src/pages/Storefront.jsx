import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  ShoppingCart,
  Send,
  Plus,
  Minus,
  Trash2,
  Check,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  X,
  ExternalLink,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import api from '../api/client';
import { formatCurrency } from '../utils/formatters';
import { playBeep, playSuccessTone } from '../utils/soundEffects';

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({
    shopName: 'ShopEase Retail Store',
    tagline: 'Clothing & General Store',
    phone: '+92 300 1234567',
    address: 'Shop # 14, Commercial Plaza, Karachi',
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');

  // Cart
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState({}); // productId -> variantId

  // Checkout form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Fetch public catalog and store settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes, setRes] = await Promise.all([
          api.get('/products/public-catalog', { params: { isActive: 'true', limit: 100 } }),
          api.get('/categories/public'),
          api.get('/settings/public'),
        ]);

        if (prodRes.data.success) {
          setProducts(prodRes.data.products || []);
          // Initialize default selected variant for each product
          const defaults = {};
          (prodRes.data.products || []).forEach((p) => {
            if (p.variants && p.variants.length > 0) {
              defaults[p._id] = p.variants[0]._id;
            }
          });
          setSelectedVariants(defaults);
        }

        if (catRes.data.success) {
          setCategories(catRes.data.categories || []);
        }

        if (setRes.data.success && setRes.data.data) {
          setSettings(setRes.data.data);
        }
      } catch (err) {
        console.error('Error fetching storefront data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSelectVariant = (productId, variantId) => {
    setSelectedVariants((prev) => ({ ...prev, [productId]: variantId }));
  };

  const handleAddToCart = (product) => {
    const variantId = selectedVariants[product._id];
    const variant = product.variants?.find((v) => v._id === variantId) || product.variants?.[0];
    if (!variant) return;

    playBeep();

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.variantId === variant._id);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += 1;
        return next;
      } else {
        return [
          ...prev,
          {
            productId: product._id,
            variantId: variant._id,
            name: product.name,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            price: variant.sellingPrice,
            stock: variant.stockQuantity,
            quantity: 1,
          },
        ];
      }
    });

    setIsCartOpen(true);
  };

  const updateCartQuantity = (variantId, newQty) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((item) => item.variantId !== variantId));
    } else {
      setCart((prev) =>
        prev.map((item) => (item.variantId === variantId ? { ...item, quantity: newQty } : item))
      );
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSendWhatsAppOrder = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    playSuccessTone();

    let itemsText = cart
      .map((item, idx) => {
        const variantDesc = [item.size, item.color].filter(Boolean).join('/');
        const desc = variantDesc ? ` (${variantDesc})` : '';
        return `${idx + 1}. *${item.name}${desc}*\n   Qty: ${item.quantity} x Rs. ${item.price.toLocaleString()} = Rs. ${(item.price * item.quantity).toLocaleString()}`;
      })
      .join('\n');

    const msg = `🛍️ *NEW ONLINE ORDER - ${settings.shopName}*\n\n` +
      `👤 *Customer Name:* ${customerName}\n` +
      `📞 *Phone / WhatsApp:* ${customerPhone}\n` +
      `📍 *Delivery Address:* ${deliveryAddress}\n` +
      (orderNotes ? `📝 *Notes:* ${orderNotes}\n` : '') +
      `\n🛒 *ORDER ITEMS:*\n${itemsText}\n\n` +
      `💰 *Total Amount:* *${formatCurrency(cartTotal)}*\n` +
      `🚚 *Payment Method:* Cash on Delivery / Raast Transfer\n\n` +
      `Please confirm my order and share delivery timing. Thank you!`;

    const cleanPhone = (settings.phone || '03001234567').replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;

    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Filter products by category and search
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.categoryId?._id === selectedCategory || p.categoryId === selectedCategory;
    const matchesSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.variants?.some((v) => v.sku?.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Store Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md shadow-primary-600/30">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <div className="font-black text-lg tracking-tight leading-none text-slate-900 dark:text-white">
                {settings.shopName}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {settings.tagline}
              </div>
            </div>
          </div>

          {/* Right Header: Cart & Staff Login */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
            >
              <UserCheck className="h-3.5 w-3.5" />
              Staff / POS
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/20 transition-all"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Cart</span>
              {cartItemCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-primary-600 font-black text-[11px]">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Welcome Banner */}
      <section className="bg-gradient-to-r from-primary-900 via-slate-900 to-indigo-950 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-primary-800/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Sparkles className="h-3.5 w-3.5" />
              Order Direct on WhatsApp • Fast Home Delivery
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Welcome to {settings.shopName}
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Browse our fresh collection of Clothing, Groceries, General Store goods, and accessories.
              Order instantly via WhatsApp!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/10">
              <Phone className="h-4 w-4 text-emerald-400" />
              <span>{settings.phone}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/10">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <span>{settings.address}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search & Categories Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              All Products
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                onClick={() => setSelectedCategory(c._id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === c._id
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 shadow-sm"
            />
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400">Loading shop catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <ShoppingBag className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
            <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">No products found</h3>
            <p className="mt-1 text-xs text-slate-500">Try adjusting your search terms or category filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map((p) => {
              const activeVariantId = selectedVariants[p._id] || p.variants?.[0]?._id;
              const activeVariant = p.variants?.find((v) => v._id === activeVariantId) || p.variants?.[0];
              const inStock = activeVariant && activeVariant.stockQuantity > 0;

              return (
                <div
                  key={p._id}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-5 space-y-3">
                    {/* Category & Stock Tag */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                        {p.categoryId?.name || (p.isClothing ? 'Clothing' : 'General Store')}
                      </span>
                      {inStock ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          In Stock ({activeVariant.stockQuantity})
                        </span>
                      ) : (
                        <span className="text-red-500 font-semibold">Out of Stock</span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-primary-600 transition-colors line-clamp-1">
                        {p.name}
                      </h3>
                      {p.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                          {p.description}
                        </p>
                      )}
                    </div>

                    {/* Variant Selector (Sizes & Colors) if multiple variants exist */}
                    {p.variants?.length > 1 && (
                      <div className="space-y-1 pt-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">
                          Select Variant / Size:
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {p.variants.map((v) => {
                            const isSelected = v._id === activeVariantId;
                            const label = [v.size, v.color].filter(Boolean).join(' - ') || v.sku;
                            return (
                              <button
                                key={v._id}
                                type="button"
                                onClick={() => handleSelectVariant(p._id, v._id)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                                  isSelected
                                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 font-bold'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price & Add to Cart Footer */}
                  <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">Price</div>
                      <div className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">
                        {formatCurrency(activeVariant ? activeVariant.sellingPrice : 0)}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!inStock}
                      onClick={() => handleAddToCart(p)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${
                        inStock
                          ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-600/20 active:scale-95'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Slide-in Shopping Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between">
              {/* Cart Drawer Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary-600" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">
                    Your Cart ({cartItemCount} items)
                  </h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400">
                    Your cart is currently empty. Add products to place an order!
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.variantId}
                      className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs"
                    >
                      <div className="flex-1">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{item.name}</div>
                        {(item.size || item.color) && (
                          <div className="text-[11px] text-slate-500 font-medium">
                            {[item.size, item.color].filter(Boolean).join(' • ')}
                          </div>
                        )}
                        <div className="text-primary-600 dark:text-primary-400 font-mono font-bold mt-1">
                          {formatCurrency(item.price)}
                        </div>
                      </div>

                      {/* Quantity buttons */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.variantId, item.quantity - 1)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2 font-mono font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.variantId, item.quantity + 1)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.variantId, 0)}
                          className="p-1.5 text-slate-400 hover:text-red-500"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Customer Checkout Form & WhatsApp Button */}
              {cart.length > 0 && (
                <form
                  onSubmit={handleSendWhatsAppOrder}
                  className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-3"
                >
                  <div className="flex justify-between items-center text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
                    <span>Order Total:</span>
                    <span className="text-xl font-black font-mono text-primary-600 dark:text-primary-400">
                      {formatCurrency(cartTotal)}
                    </span>
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Your Name *"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Mobile / WhatsApp Number *"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Complete Delivery Address & City *"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Special instructions or notes"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl font-black text-xs text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/25 flex items-center justify-center gap-2 transition-all mt-2 active:scale-98"
                  >
                    <Send className="h-4 w-4" />
                    Place Order on WhatsApp ({formatCurrency(cartTotal)})
                  </button>
                  <p className="text-[10px] text-center text-slate-400">
                    Your order details will open directly in WhatsApp to chat with our store team.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

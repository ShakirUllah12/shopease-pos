import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  Check,
  X,
  Layers,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react';
import api from '../api/client';
import { useNotification } from '../context/NotificationContext';
import { formatPKR, formatDateTime } from '../utils/formatters';

export default function Products() {
  const notify = useNotification();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Expanded variant rows
  const [expandedProductIds, setExpandedProductIds] = useState([]);

  // Product Details View Modal State
  const [viewingProduct, setViewingProduct] = useState(null);

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form State
  const [productName, setProductName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isClothing, setIsClothing] = useState(false);
  const [description, setDescription] = useState('');
  const [trackStock, setTrackStock] = useState(true);
  const [variants, setVariants] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch products and categories
  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get(`/products?search=${encodeURIComponent(search)}&categoryId=${filterCategory}&lowStock=${lowStockFilter}&isActive=all`),
        api.get('/categories'),
      ]);

      if (prodRes.data?.products) setProducts(prodRes.data.products);
      if (catRes.data?.categories) {
        setCategories(catRes.data.categories);
        if (!selectedCategoryId && catRes.data.categories.length > 0) {
          setSelectedCategoryId(catRes.data.categories[0]._id);
        }
      }
    } catch (err) {
      notify.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterCategory, lowStockFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(fetchData, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const toggleExpand = (id) => {
    setExpandedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setProductName('');
    const defaultCat = categories.find((c) => c.name === 'Clothing') || categories[0];
    setSelectedCategoryId(defaultCat ? defaultCat._id : '');
    setIsClothing(defaultCat ? defaultCat.name === 'Clothing' : false);
    setDescription('');
    setTrackStock(true);

    // Initial default variant
    setVariants([
      {
        sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
        variantName: 'Default',
        size: '',
        color: '',
        costPrice: '',
        sellingPrice: '',
        initialStock: 10,
        minStockAlert: 5,
        barcode: '',
      },
    ]);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setSelectedCategoryId(product.categoryId?._id || product.categoryId);
    setIsClothing(product.isClothing);
    setDescription(product.description || '');
    setTrackStock(product.trackStock);

    setVariants(
      product.variants && product.variants.length > 0
        ? product.variants.map((v) => ({
            _id: v._id,
            sku: v.sku,
            variantName: v.variantName,
            size: v.size || '',
            color: v.color || '',
            costPrice: v.costPrice,
            sellingPrice: v.sellingPrice,
            currentStock: v.currentStock,
            minStockAlert: v.minStockAlert,
            barcode: v.barcode || '',
          }))
        : []
    );
    setIsModalOpen(true);
  };

  // Variant helper functions in modal
  const handleAddVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      {
        sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
        variantName: isClothing ? 'Variant' : 'Default',
        size: isClothing ? 'M' : '',
        color: isClothing ? 'Blue' : '',
        costPrice: prev[0]?.costPrice || '',
        sellingPrice: prev[0]?.sellingPrice || '',
        initialStock: 0,
        minStockAlert: 5,
        barcode: '',
      },
    ]);
  };

  const handleRemoveVariantRow = (index) => {
    if (variants.length <= 1) {
      notify.warning('Product must have at least one variant.');
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index, field, value) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Submit product create/update
  const handleSaveProduct = async (e) => {
    e.preventDefault();

    if (!productName.trim()) {
      notify.error('Product name is required');
      return;
    }

    if (variants.length === 0) {
      notify.error('At least one variant/price is required');
      return;
    }

    // Check duplicate SKUs in form
    const skus = variants.map((v) => v.sku.trim().toUpperCase());
    const dup = skus.find((s, idx) => skus.indexOf(s) !== idx);
    if (dup) {
      notify.error(`Duplicate SKU detected: ${dup}. Each variant requires a unique SKU.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: productName.trim(),
        categoryId: selectedCategoryId,
        isClothing,
        description,
        trackStock,
        variants: variants.map((v) => ({
          ...v,
          sku: v.sku.trim().toUpperCase(),
          costPrice: Number(v.costPrice) || 0,
          sellingPrice: Number(v.sellingPrice) || 0,
          minStockAlert: Number(v.minStockAlert) || 5,
          initialStock: Number(v.initialStock) || 0,
        })),
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
        notify.success('Product updated successfully!');
      } else {
        await api.post('/products', payload);
        notify.success('Product created successfully!');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active/inactive
  const handleToggleStatus = async (product) => {
    try {
      await api.patch(`/products/${product._id}/toggle-status`);
      notify.success(`Product ${product.isActive ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch (err) {
      notify.error('Failed to change product status');
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Products & Inventory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage Clothing sizes/colors and General Store catalog
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name, SKU, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto text-xs">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-colors ${
              lowStockFilter
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Low Stock Only</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 w-10"></th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Total Stock</th>
                <th className="py-3 px-4">Price Range (PKR)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading product catalog...
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => {
                  const isExpanded = expandedProductIds.includes(p._id);
                  const totalStock = p.variants?.reduce((sum, v) => sum + (v.currentStock || 0), 0) || 0;
                  const isLow = p.variants?.some((v) => v.currentStock <= v.minStockAlert);
                  const prices = p.variants?.map((v) => v.sellingPrice) || [0];
                  const minPrice = Math.min(...prices);
                  const maxPrice = Math.max(...prices);

                  return (
                    <React.Fragment key={p._id}>
                      <tr className={`hover:bg-slate-50/70 transition-colors ${!p.isActive ? 'opacity-60 bg-slate-50/40' : ''}`}>
                        <td className="py-3 px-4 text-center">
                          {p.variants && p.variants.length > 0 && (
                            <button
                              onClick={() => toggleExpand(p._id)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => setViewingProduct(p)}
                            className="font-bold text-slate-900 text-sm hover:text-brand-600 transition-colors text-left block"
                          >
                            {p.name}
                          </button>
                          {p.description && (
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">{p.description}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-600">
                          {p.categoryId?.name || p.categoryName || 'General'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            p.isClothing ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {p.isClothing ? 'Clothing' : 'General Store'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-bold ${isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                            {totalStock} units
                          </span>
                          {isLow && (
                            <span className="ml-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1 rounded">
                              Low
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {minPrice === maxPrice
                            ? formatPKR(minPrice)
                            : `${formatPKR(minPrice)} - ${formatPKR(maxPrice)}`}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            p.isActive ? 'text-emerald-700' : 'text-slate-400'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${p.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            {p.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingProduct(p)}
                              title="View Product Details"
                              className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              title="Edit Product & Variants"
                              className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(p)}
                              title={p.isActive ? 'Deactivate Product' : 'Activate Product'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                p.isActive
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {p.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Variants Sub-Table */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan="8" className="p-3 pl-12 pr-6">
                            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
                              <h5 className="font-bold text-slate-700 text-xs mb-2">
                                Product Variants ({p.variants?.length || 0})
                              </h5>
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase">
                                    <th className="pb-1.5">SKU</th>
                                    <th className="pb-1.5">Variant Details</th>
                                    <th className="pb-1.5">Cost Price</th>
                                    <th className="pb-1.5">Selling Price</th>
                                    <th className="pb-1.5">Gross Margin</th>
                                    <th className="pb-1.5">Current Stock</th>
                                    <th className="pb-1.5">Alert Level</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                  {p.variants?.map((v) => {
                                    const margin = v.sellingPrice - v.costPrice;
                                    return (
                                      <tr key={v._id}>
                                        <td className="py-1.5 font-mono font-bold text-slate-800">{v.sku}</td>
                                        <td className="py-1.5 text-slate-600">
                                          {v.variantName || [v.color, v.size].filter(Boolean).join(' / ') || 'Default'}
                                        </td>
                                        <td className="py-1.5 text-slate-500">{formatPKR(v.costPrice)}</td>
                                        <td className="py-1.5 font-bold text-slate-900">{formatPKR(v.sellingPrice)}</td>
                                        <td className="py-1.5 text-emerald-700">+{formatPKR(margin)}</td>
                                        <td className="py-1.5">
                                          <span className={`font-bold ${v.currentStock <= v.minStockAlert ? 'text-amber-600' : 'text-slate-800'}`}>
                                            {v.currentStock}
                                          </span>
                                        </td>
                                        <td className="py-1.5 text-slate-400">{v.minStockAlert}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No products found matching criteria. Click "Add New Product" to register items.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingProduct ? 'Edit Product & Variants' : 'Register New Product'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure category, base pricing, and size/color variants
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Product Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Slim-Fit Cotton Chino or Dalda Cooking Oil 1L"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => {
                      setSelectedCategoryId(e.target.value);
                      const cat = categories.find((c) => c._id === e.target.value);
                      if (cat) {
                        setIsClothing(cat.name === 'Clothing');
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Department Type
                  </label>
                  <div className="flex items-center gap-3 mt-1.5">
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                      <input
                        type="radio"
                        checked={isClothing}
                        onChange={() => setIsClothing(true)}
                        className="text-brand-600"
                      />
                      <span>Clothing (Sizes/Colors)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                      <input
                        type="radio"
                        checked={!isClothing}
                        onChange={() => setIsClothing(false)}
                        className="text-brand-600"
                      />
                      <span>General Store</span>
                    </label>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Product Description / Notes
                  </label>
                  <input
                    type="text"
                    placeholder="Optional item details, fabric, or brand notes"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Variants Section */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      {isClothing ? 'Clothing Variant Editor (Sizes & Colors)' : 'General Store Default Variant (Single Item Pricing)'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {isClothing
                        ? 'Add individual sizes (S, M, L, XL) and colors with dedicated SKUs and stock'
                        : 'Standard packaged retail product with SKU, barcode, price, and stock'}
                    </p>
                  </div>
                  {isClothing ? (
                    <button
                      type="button"
                      onClick={handleAddVariantRow}
                      className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-300 rounded-lg font-bold text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Size/Color Variant</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">
                      Single Default Variant
                    </span>
                  )}
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {variants.map((v, idx) => (
                    <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">SKU *</label>
                          <input
                            type="text"
                            required
                            placeholder="SKU"
                            value={v.sku}
                            onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold uppercase focus:outline-none focus:border-brand-500"
                          />
                        </div>

                        {isClothing && (
                          <>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Size</label>
                              <input
                                type="text"
                                placeholder="S, M, L, XL, 32"
                                value={v.size}
                                onChange={(e) => handleVariantChange(idx, 'size', e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Color</label>
                              <input
                                type="text"
                                placeholder="Navy, Black, White"
                                value={v.color}
                                onChange={(e) => handleVariantChange(idx, 'color', e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg focus:outline-none"
                              />
                            </div>
                          </>
                        )}

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Barcode</label>
                          <input
                            type="text"
                            placeholder="Scan / Barcode"
                            value={v.barcode}
                            onChange={(e) => handleVariantChange(idx, 'barcode', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Cost Price (Rs.) *</label>
                          <input
                            type="number"
                            min="0"
                            required
                            placeholder="Cost"
                            value={v.costPrice}
                            onChange={(e) => handleVariantChange(idx, 'costPrice', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg font-semibold focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Selling Price (Rs.) *</label>
                          <input
                            type="number"
                            min="0"
                            required
                            placeholder="Selling"
                            value={v.sellingPrice}
                            onChange={(e) => handleVariantChange(idx, 'sellingPrice', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg font-bold text-brand-700 focus:outline-none"
                          />
                        </div>

                        {!editingProduct && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Opening Stock</label>
                            <input
                              type="number"
                              min="0"
                              placeholder="Qty"
                              value={v.initialStock}
                              onChange={(e) => handleVariantChange(idx, 'initialStock', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg focus:outline-none"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Min Alert Level</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="5"
                            value={v.minStockAlert}
                            onChange={(e) => handleVariantChange(idx, 'minStockAlert', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg focus:outline-none"
                          />
                        </div>

                        {variants.length > 1 && (
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveVariantRow(idx)}
                              className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 text-xs font-semibold"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
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
                  className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md shadow-brand-500/25 transition-all"
                >
                  {isSubmitting ? 'Saving...' : 'Save Product & Variants'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Details View Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  viewingProduct.isClothing ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{viewingProduct.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      viewingProduct.isClothing
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {viewingProduct.isClothing ? 'Clothing' : 'General Store'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      viewingProduct.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {viewingProduct.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Category: <strong className="text-slate-700">{viewingProduct.categoryId?.name || viewingProduct.categoryName || 'General'}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {viewingProduct.description && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                  <span className="font-semibold text-slate-500 block mb-0.5 text-[10px] uppercase">Description</span>
                  <p>{viewingProduct.description}</p>
                </div>
              )}

              {/* Metrics */}
              {(() => {
                const totalStock = viewingProduct.variants?.reduce((sum, v) => sum + (v.stockQuantity !== undefined ? v.stockQuantity : (v.currentStock || 0)), 0) || 0;
                const totalCostVal = viewingProduct.variants?.reduce((sum, v) => sum + (v.stockQuantity !== undefined ? v.stockQuantity : (v.currentStock || 0)) * (v.costPrice || 0), 0) || 0;
                const totalRetailVal = viewingProduct.variants?.reduce((sum, v) => sum + (v.stockQuantity !== undefined ? v.stockQuantity : (v.currentStock || 0)) * (v.sellingPrice || 0), 0) || 0;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Stock Units</span>
                      <span className="text-lg font-black text-slate-900">{totalStock}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Cost Valuation</span>
                      <span className="text-lg font-black text-slate-700">{formatPKR(totalCostVal)}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Retail Valuation</span>
                      <span className="text-lg font-black text-brand-600">{formatPKR(totalRetailVal)}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Unrealized Margin</span>
                      <span className="text-lg font-black text-emerald-700">+{formatPKR(totalRetailVal - totalCostVal)}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Variants Breakdown Table */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  All Product Variants ({viewingProduct.variants?.length || 0})
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">SKU</th>
                        <th className="py-2 px-3">Variant (Size/Color)</th>
                        <th className="py-2 px-3">Barcode</th>
                        <th className="py-2 px-3">Cost Price</th>
                        <th className="py-2 px-3">Selling Price</th>
                        <th className="py-2 px-3">Margin</th>
                        <th className="py-2 px-3">Stock Quantity</th>
                        <th className="py-2 px-3">Alert Threshold</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {viewingProduct.variants?.map((v) => {
                        const stock = v.stockQuantity !== undefined ? v.stockQuantity : v.currentStock;
                        const threshold = v.lowStockThreshold !== undefined ? v.lowStockThreshold : v.minStockAlert;
                        const margin = v.sellingPrice - v.costPrice;
                        const marginPct = v.sellingPrice > 0 ? Math.round((margin / v.sellingPrice) * 100) : 0;

                        return (
                          <tr key={v._id} className="hover:bg-slate-50/70">
                            <td className="py-2 px-3 font-mono font-bold text-slate-900">{v.sku}</td>
                            <td className="py-2 px-3 text-slate-700">
                              {v.variantName || [v.color, v.size].filter(Boolean).join(' / ') || 'Default'}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-500">{v.barcode || '-'}</td>
                            <td className="py-2 px-3 text-slate-600">{formatPKR(v.costPrice)}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">{formatPKR(v.sellingPrice)}</td>
                            <td className="py-2 px-3 text-emerald-700">
                              +{formatPKR(margin)} <span className="text-[10px] text-slate-400 font-normal">({marginPct}%)</span>
                            </td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                                stock <= threshold ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                              }`}>
                                {stock}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-400">{threshold}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Timestamp Metadata */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap justify-between text-[11px] text-slate-400 font-medium">
                <span>Created: {formatDateTime(viewingProduct.createdAt, true)}</span>
                <span>Last Updated: {formatDateTime(viewingProduct.updatedAt, true)}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = viewingProduct;
                  setViewingProduct(null);
                  handleOpenEditModal(p);
                }}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs"
              >
                Edit Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

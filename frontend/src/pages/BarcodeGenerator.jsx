import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import JsBarcode from 'jsbarcode';
import {
  Printer,
  Barcode as BarcodeIcon,
  Search,
  Settings2,
  Copy,
  Layers,
  Sparkles,
  FileText,
  Tag,
  CheckCircle,
} from 'lucide-react';
import api from '../api/client';
import { formatCurrency } from '../utils/formatters';

export default function BarcodeGenerator() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Auto-search product if navigated from catalog with state
  useEffect(() => {
    if (location.state?.sku) {
      setSearch(location.state.sku);
    } else if (location.state?.productName) {
      setSearch(location.state.productName);
    }
  }, [location.state]);

  // Selected item configuration
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [customLabel, setCustomLabel] = useState({
    shopName: 'ShopEase POS',
    productName: 'Sample Retail Item',
    sku: 'SHOP-1001',
    price: 950,
  });
  const [copies, setCopies] = useState(12);
  const [labelSize, setLabelSize] = useState('50x25'); // '50x25', '38x25', 'a4_sheet'
  const [showPrice, setShowPrice] = useState(true);
  const [showShopName, setShowShopName] = useState(true);

  // Search products
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const res = await api.get('/products', { params: { search, limit: 30 } });
        if (res.data.success) {
          setProducts(res.data.products || []);
          if (!selectedVariant && res.data.products.length > 0 && res.data.products[0].variants?.length > 0) {
            handleSelectProductVariant(res.data.products[0], res.data.products[0].variants[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load products for barcode:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchCatalog, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSelectProductVariant = (product, variant) => {
    const variantDesc = [variant.size, variant.color].filter(Boolean).join(' - ');
    const fullTitle = variantDesc ? `${product.name} (${variantDesc})` : product.name;

    setSelectedVariant({ product, variant });
    setCustomLabel((prev) => ({
      ...prev,
      productName: fullTitle,
      sku: variant.sku,
      price: variant.sellingPrice,
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Non-printable Screen Header */}
      <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarcodeIcon className="h-7 w-7 text-primary-600" />
            Barcode & Price Tag Generator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate and print retail price stickers for thermal label printers or A4 adhesive sheets
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700 transition-colors"
        >
          <Printer className="h-4 w-4" />
          Print Barcode Labels ({copies} Labels)
        </button>
      </div>

      <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Product Picker & Configuration */}
        <div className="lg:col-span-5 space-y-5">
          {/* Label Settings */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary-600" />
              Sticker Label Format & Layout
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Label Sheet Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '50x25', title: '50 x 25 mm', desc: 'Standard Thermal' },
                    { id: '38x25', title: '38 x 25 mm', desc: 'Compact / Jewelry' },
                    { id: 'a4_sheet', title: 'A4 Sheet (30-up)', desc: 'Standard Laser' },
                  ].map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setLabelSize(size.id)}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        labelSize === size.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100 font-bold'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-[11px] font-bold">{size.title}</div>
                      <div className="text-[10px] opacity-75">{size.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Number of Copies
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={copies}
                    onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Shop Name Display
                  </label>
                  <input
                    type="text"
                    value={customLabel.shopName}
                    onChange={(e) => setCustomLabel({ ...customLabel, shopName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  Print Price (Rs.)
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    checked={showShopName}
                    onChange={(e) => setShowShopName(e.target.checked)}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  Show Shop Name
                </label>
              </div>
            </div>
          </div>

          {/* Product Selector */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary-600" />
              Select Product From Catalog
            </h3>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search catalog by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl">
              {products.map((p) =>
                p.variants?.map((v) => {
                  const isSelected = selectedVariant?.variant?._id === v._id;
                  return (
                    <button
                      key={v._id}
                      type="button"
                      onClick={() => handleSelectProductVariant(p, v)}
                      className={`w-full text-left p-2.5 flex items-center justify-between text-xs transition-colors ${
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-900 dark:text-primary-100'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-semibold truncate max-w-xs">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          SKU: {v.sku} {v.size ? `• Size: ${v.size}` : ''} {v.color ? `• ${v.color}` : ''}
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(v.sellingPrice)}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Interactive Live Label Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  Live Barcode Sticker Preview
                </h3>
                <p className="text-[11px] text-slate-400">
                  Showing {copies} copies formatted for {labelSize.toUpperCase()}
                </p>
              </div>

              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Now
              </button>
            </div>

            {/* Simulated Label Sheet Container */}
            <div className="bg-slate-100 dark:bg-slate-950/70 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 max-h-[520px] overflow-y-auto justify-center">
              {Array.from({ length: copies }).map((_, idx) => (
                <BarcodeTag
                  key={idx}
                  shopName={showShopName ? customLabel.shopName : ''}
                  productName={customLabel.productName}
                  sku={customLabel.sku}
                  price={showPrice ? customLabel.price : null}
                  labelSize={labelSize}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pure Print-Only Layout (hidden on screen, activated during window.print()) */}
      <div className="print-only hidden">
        <div
          className={`print-container ${
            labelSize === 'a4_sheet'
              ? 'grid grid-cols-3 gap-2'
              : 'flex flex-wrap gap-2'
          }`}
        >
          {Array.from({ length: copies }).map((_, idx) => (
            <BarcodeTag
              key={`print-${idx}`}
              shopName={showShopName ? customLabel.shopName : ''}
              productName={customLabel.productName}
              sku={customLabel.sku}
              price={showPrice ? customLabel.price : null}
              labelSize={labelSize}
            />
          ))}
        </div>
      </div>

      {/* Inline styles for precise print output */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
            visibility: visible !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-only * {
            visibility: visible !important;
          }
          @page {
            margin: 4mm;
            size: auto;
          }
        }
      `}</style>
    </div>
  );
}

// Single Barcode Sticker Component
function BarcodeTag({ shopName, productName, sku, price, labelSize }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current && sku) {
      try {
        JsBarcode(svgRef.current, sku, {
          format: 'CODE128',
          width: labelSize === '38x25' ? 1.2 : 1.4,
          height: labelSize === '38x25' ? 24 : 30,
          displayValue: true,
          fontSize: 9,
          margin: 0,
          textMargin: 1,
        });
      } catch (err) {
        console.error('JsBarcode render error:', err);
      }
    }
  }, [sku, labelSize]);

  // Dimensions based on selected sticker format
  const sizeClasses =
    labelSize === '38x25'
      ? 'w-[140px] h-[95px] p-1.5'
      : labelSize === 'a4_sheet'
      ? 'w-[190px] h-[110px] p-2'
      : 'w-[185px] h-[105px] p-2';

  return (
    <div
      className={`bg-white text-black border border-slate-300 rounded-md shadow-sm flex flex-col justify-between items-center text-center overflow-hidden break-inside-avoid ${sizeClasses}`}
      style={{ boxSizing: 'border-box' }}
    >
      {/* Header: Shop Name */}
      {shopName && (
        <div className="text-[9px] font-black tracking-wider uppercase truncate w-full text-slate-800">
          {shopName}
        </div>
      )}

      {/* Product Title */}
      <div className="text-[10px] font-bold leading-tight truncate w-full text-slate-900 mt-0.5">
        {productName}
      </div>

      {/* Barcode SVG */}
      <div className="my-0.5 flex justify-center items-center w-full">
        <svg ref={svgRef} className="max-w-full" />
      </div>

      {/* Price tag */}
      {price !== null && (
        <div className="text-[11px] font-black text-slate-900 border-t border-dashed border-slate-300 w-full pt-0.5 tracking-tight">
          Rs. {Number(price).toLocaleString()}
        </div>
      )}
    </div>
  );
}

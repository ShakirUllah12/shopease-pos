import React from 'react';
import { X, Check, ShoppingCart, AlertCircle } from 'lucide-react';
import { formatPKR } from '../utils/formatters';

export default function VariantSelectorModal({ product, onClose, onSelectVariant }) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800 text-base">{product.name}</h3>
            <p className="text-xs text-slate-500">Select Size & Color Variant</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
          {product.variants && product.variants.length > 0 ? (
            product.variants.map((variant) => {
              const isOutOfStock = product.trackStock && variant.currentStock <= 0;
              const isLowStock = product.trackStock && variant.currentStock > 0 && variant.currentStock <= variant.minStockAlert;

              return (
                <div
                  key={variant._id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isOutOfStock
                      ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                      : 'border-slate-200 hover:border-brand-500 hover:bg-brand-50/40 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!isOutOfStock) {
                      onSelectVariant(variant);
                    }
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">
                        {variant.variantName || [variant.color, variant.size].filter(Boolean).join(' / ') || 'Default'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {variant.sku}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>Price: <strong className="text-slate-800">{formatPKR(variant.sellingPrice)}</strong></span>
                      <span>
                        Stock:{' '}
                        <strong
                          className={
                            isOutOfStock
                              ? 'text-rose-600'
                              : isLowStock
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                          }
                        >
                          {variant.currentStock} units
                        </strong>
                      </span>
                    </div>
                  </div>

                  <button
                    disabled={isOutOfStock}
                    className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                      isOutOfStock
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{isOutOfStock ? 'Sold Out' : 'Add'}</span>
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-slate-500 text-sm">
              No active variants found for this item.
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

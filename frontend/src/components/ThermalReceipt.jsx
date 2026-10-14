import React from 'react';
import { formatPKR, formatReceiptTime } from '../utils/formatters';

/**
 * ThermalReceipt Component
 * Renders an authentic, compact thermal receipt optimized for 58mm, 80mm, and A4 formats.
 * Uses strict thermal-friendly typography, high-contrast monochrome layout,
 * and printable container (#printable-receipt).
 */
export default function ThermalReceipt({
  sale,
  storeSettings,
  paperWidth = '80mm',
  showTagline = true,
  showCashier = true,
  showBarcode = true,
  showFooter = true,
}) {
  if (!sale) return null;

  const is58mm = paperWidth === '58mm';
  const isA4 = paperWidth === 'a4';

  let widthClass = 'w-[80mm] max-w-[300px] p-3 text-[11px]';
  if (is58mm) {
    widthClass = 'w-[58mm] max-w-[220px] p-2 text-[10px]';
  } else if (isA4) {
    widthClass = 'w-full max-w-[680px] p-6 text-xs';
  }

  const shopName = storeSettings?.shopName || 'ShopEase POS';
  const tagline = storeSettings?.tagline || 'Clothing & General Store';
  const address = storeSettings?.address || 'Commercial Plaza, Main Market';
  const phone = storeSettings?.phone || '+92 300 1234567';
  const receiptFooter = storeSettings?.receiptFooter || 'Thank you for your visit! Exchanges valid within 7 days with original receipt.';

  return (
    <div
      id="printable-receipt"
      className={`mx-auto bg-white text-black font-mono leading-tight select-all border border-slate-300 shadow-sm transition-all ${widthClass}`}
      style={{ fontFamily: '"Courier New", Courier, monospace' }}
    >
      {/* Shop Header */}
      <div className="text-center mb-2">
        <h2 className={`${isA4 ? 'text-lg' : 'text-sm'} font-black tracking-tight uppercase`}>{shopName}</h2>
        {showTagline && tagline && <p className="text-[10px] text-gray-700">{tagline}</p>}
        {address && <p className="text-[9px] text-gray-700 mt-0.5">{address}</p>}
        {phone && <p className="text-[10px] font-bold mt-0.5">Phone: {phone}</p>}
      </div>

      <div className="border-b border-dashed border-black my-1.5" />

      {/* Sale Metadata */}
      <div className="text-[10px] space-y-0.5 mb-1.5">
        <div className="flex justify-between">
          <span className="font-bold">RECEIPT #:</span>
          <span className="font-bold">{sale.receiptNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date/Time:</span>
          <span>{formatReceiptTime(sale.createdAt)}</span>
        </div>
        {showCashier && (
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>{sale.cashierName || 'Cashier Staff'}</span>
          </div>
        )}
        {sale.customerName && sale.customerName !== 'Walk-in Customer' && (
          <div className="flex justify-between">
            <span>Customer:</span>
            <span className="font-semibold">{sale.customerName}</span>
          </div>
        )}
        {sale.customerPhone && (
          <div className="flex justify-between">
            <span>Contact:</span>
            <span>{sale.customerPhone}</span>
          </div>
        )}
      </div>

      <div className="border-b border-dashed border-black my-1.5" />

      {/* Items Header */}
      <div className="flex justify-between font-bold text-[10px] mb-1">
        <span>ITEM / VARIANT</span>
        <span>TOTAL</span>
      </div>

      {/* Line Items */}
      <div className="space-y-1.5 my-1">
        {sale.items?.map((item, index) => {
          const variantDesc = [item.color, item.size].filter(Boolean).join(' / ');
          return (
            <div key={index} className="text-[10px]">
              <div className="font-medium text-left truncate">
                {item.productName}
                {variantDesc && <span className="font-normal text-gray-700"> ({variantDesc})</span>}
              </div>
              <div className="flex justify-between text-gray-800">
                <span>
                  {item.quantity} x {formatPKR(item.unitPrice, false)}
                  {item.discount > 0 && <span className="text-[9px]"> (-{formatPKR(item.discount, false)})</span>}
                </span>
                <span className="font-bold">{formatPKR(item.lineTotal, false)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-b border-dashed border-black my-1.5" />

      {/* Totals Breakdown */}
      <div className="space-y-0.5 text-[11px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatPKR(sale.subtotal, true)}</span>
        </div>
        {sale.orderDiscount > 0 && (
          <div className="flex justify-between text-gray-800">
            <span>Order Discount:</span>
            <span>-{formatPKR(sale.orderDiscount, true)}</span>
          </div>
        )}
        {sale.taxAmount > 0 && (
          <div className="flex justify-between">
            <span>Tax / GST:</span>
            <span>{formatPKR(sale.taxAmount, true)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs font-black border-t border-black pt-1 mt-1">
          <span>NET TOTAL:</span>
          <span>{formatPKR(sale.totalAmount, true)}</span>
        </div>
      </div>

      <div className="border-b border-dashed border-black my-1.5" />

      {/* Payment Details */}
      <div className="text-[10px] space-y-0.5">
        <div className="font-bold mb-0.5">PAYMENT SUMMARY:</div>
        {sale.payments && sale.payments.length > 0 ? (
          sale.payments.map((p, idx) => (
            <div key={idx} className="flex justify-between capitalize">
              <span>
                {p.method.replace('_', ' ')}
                {p.referenceNumber && <span className="text-[9px] text-gray-600"> ({p.referenceNumber})</span>}:
              </span>
              <span className="font-semibold">{formatPKR(p.amount, true)}</span>
            </div>
          ))
        ) : (
          <div className="flex justify-between">
            <span>Amount Paid:</span>
            <span>{formatPKR(sale.amountPaid, true)}</span>
          </div>
        )}

        {sale.changeGiven > 0 && (
          <div className="flex justify-between font-bold border-t border-dotted border-gray-400 pt-0.5 mt-0.5">
            <span>Change Returned:</span>
            <span>{formatPKR(sale.changeGiven, true)}</span>
          </div>
        )}
      </div>

      <div className="border-b border-dashed border-black my-2" />

      {/* Barcode & Verification */}
      {showBarcode && (
        <div className="text-center my-2">
          {/* Simulated Code-128 High Contrast Barcode */}
          <div className="inline-block py-1 px-3 bg-white border border-gray-300">
            <div className="h-7 flex items-center justify-center tracking-widest text-[16px] font-bold select-none text-black">
              ||| | |||| | ||| || ||| | ||
            </div>
            <div className="text-[8px] font-mono tracking-wider text-gray-700">
              {sale.receiptNumber}
            </div>
          </div>
        </div>
      )}

      {/* Footer & Exchange Policy */}
      {showFooter && (
        <div className="text-center text-[9px] text-gray-700 space-y-1 mt-1">
          <p>{receiptFooter}</p>
          <p className="font-mono text-[8px] tracking-widest text-gray-500">
            * * * ShopEase POS Retail System * * *
          </p>
        </div>
      )}
    </div>
  );
}

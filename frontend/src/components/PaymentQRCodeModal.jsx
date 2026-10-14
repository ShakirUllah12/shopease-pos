import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, X, Copy, Check, ExternalLink, ShieldCheck, Wallet, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function PaymentQRCodeModal({
  isOpen,
  onClose,
  amount = 0,
  saleNumber = 'SALE-TEMP',
  settings = {},
  onConfirmPayment,
}) {
  const [selectedMethod, setSelectedMethod] = useState('raast');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [copiedField, setCopiedField] = useState(null);

  // Settings fallbacks with default store demo accounts if not configured
  const digitalConfig = {
    raast: {
      id: settings?.raastId || '03001234567',
      title: settings?.raastTitle || settings?.shopName || 'ShopEase POS Store',
      label: 'Raast Instant Payment',
      color: 'bg-emerald-600',
      textColor: 'text-emerald-700',
      badge: 'SBP Raast (Zero Fee)',
    },
    jazzcash: {
      id: settings?.jazzcashNumber || '03001234567',
      title: settings?.jazzcashTitle || settings?.shopName || 'ShopEase Retail',
      label: 'JazzCash QR',
      color: 'bg-red-600',
      textColor: 'text-red-700',
      badge: 'JazzCash Wallet',
    },
    easypaisa: {
      id: settings?.easypaisaNumber || '03451234567',
      title: settings?.easypaisaTitle || settings?.shopName || 'ShopEase Retail',
      label: 'EasyPaisa QR',
      color: 'bg-green-600',
      textColor: 'text-green-700',
      badge: 'EasyPaisa Wallet',
    },
    bank: {
      id: settings?.bankIban || 'PK36MEZN0001234567890101',
      title: settings?.bankAccountTitle || settings?.shopName || 'ShopEase POS',
      bankName: settings?.bankName || 'Meezan Bank Ltd',
      label: 'Direct Bank Transfer',
      color: 'bg-blue-600',
      textColor: 'text-blue-700',
      badge: '1Link 24/7 IBAN',
    },
  };

  const current = digitalConfig[selectedMethod] || digitalConfig.raast;

  // Generate dynamic QR code string
  useEffect(() => {
    if (!isOpen) return;

    let payload = '';
    if (selectedMethod === 'raast') {
      // Standard Raast P2P / P2M payment URI string
      payload = `raast://pay?id=${encodeURIComponent(current.id)}&title=${encodeURIComponent(current.title)}&amount=${amount}&ref=${encodeURIComponent(saleNumber)}`;
    } else if (selectedMethod === 'jazzcash') {
      payload = `jazzcash://transfer?to=${encodeURIComponent(current.id)}&amount=${amount}&ref=${encodeURIComponent(saleNumber)}`;
    } else if (selectedMethod === 'easypaisa') {
      payload = `easypaisa://send?account=${encodeURIComponent(current.id)}&amount=${amount}&memo=${encodeURIComponent(saleNumber)}`;
    } else {
      payload = `iban:${current.id}?amount=${amount}&name=${encodeURIComponent(current.title)}&bank=${encodeURIComponent(current.bankName || '')}`;
    }

    QRCode.toDataURL(payload, {
      width: 260,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [isOpen, selectedMethod, amount, saleNumber, current]);

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirm = () => {
    if (onConfirmPayment) {
      onConfirmPayment({
        method: selectedMethod,
        amount,
        referenceNumber: referenceNumber.trim() || `${selectedMethod.toUpperCase()}-${Date.now().toString().slice(-6)}`,
      });
    }
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Digital Payment QR Code
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customer scans with any Mobile Banking or Wallet app
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Method Switcher Tabs */}
        <div className="grid grid-cols-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/50 p-1.5 gap-1 text-xs font-semibold">
          {[
            { id: 'raast', name: 'Raast', badge: '0% Fee' },
            { id: 'jazzcash', name: 'JazzCash', badge: 'Wallet' },
            { id: 'easypaisa', name: 'EasyPaisa', badge: 'Wallet' },
            { id: 'bank', name: 'Bank IBAN', badge: 'Direct' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedMethod(tab.id)}
              className={`py-2 px-2 rounded-lg transition-all text-center ${
                selectedMethod === tab.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold border border-slate-200/60 dark:border-slate-600'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <div>{tab.name}</div>
              <div className="text-[10px] opacity-75 font-normal">{tab.badge}</div>
            </button>
          ))}
        </div>

        {/* QR Body & Details */}
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* QR Card */}
            <div className="relative shrink-0 rounded-2xl p-3 bg-white border-2 border-slate-200 dark:border-slate-700 shadow-md">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Payment QR Code" className="w-48 h-48 block rounded-lg" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs">
                  Generating QR...
                </div>
              )}
              <div className="mt-2 text-center">
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {current.badge}
                </span>
              </div>
            </div>

            {/* Account Details & Amount */}
            <div className="flex-1 w-full space-y-3">
              <div className="rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-850 p-3">
                <div className="text-xs text-primary-700 dark:text-primary-300 font-medium">Payable Amount</div>
                <div className="text-2xl font-black text-primary-900 dark:text-primary-100">
                  {formatCurrency(amount)}
                </div>
                <div className="text-[11px] text-primary-600 dark:text-primary-400 mt-0.5">
                  Ref: {saleNumber}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {/* Account Number / Phone / IBAN */}
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                    {selectedMethod === 'bank' ? 'IBAN / Account Number' : 'Merchant Mobile / ID'}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 font-semibold text-xs break-all">
                    <span>{current.id}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(current.id, 'id')}
                      className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white shrink-0"
                      title="Copy"
                    >
                      {copiedField === 'id' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Account Title */}
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Account Title</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-0.5 truncate">
                    {current.title}
                  </div>
                </div>

                {selectedMethod === 'bank' && current.bankName && (
                  <div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">Bank Name</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-0.5">
                      {current.bankName}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reference Number input to record on receipt */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Customer Transaction / Approval Ref # (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. TID-982314 or last 4 digits"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all"
          >
            <ShieldCheck className="h-4 w-4" />
            Confirm Payment Received ({formatCurrency(amount)})
          </button>
        </div>
      </div>
    </div>
  );
}

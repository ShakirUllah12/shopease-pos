import React, { useState } from 'react';
import {
  Printer,
  Copy,
  Check,
  Info,
  X,
  Share2,
  Download,
  Usb,
  MessageCircle,
  FileText,
  DollarSign,
  Maximize2,
  Settings2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import ThermalReceipt from './ThermalReceipt';
import { useNotification } from '../context/NotificationContext';
import { formatPKR, formatReceiptTime } from '../utils/formatters';
import {
  generatePlainTextReceipt,
  downloadReceiptFile,
  openWhatsAppReceipt,
  printDirectWebUSB,
} from '../utils/printerService';

export default function PrintReceiptModal({ sale, storeSettings, onClose }) {
  const [paperWidth, setPaperWidth] = useState('80mm'); // '80mm', '58mm', 'a4'
  const [copied, setCopied] = useState(false);
  const [printCopies, setPrintCopies] = useState(1);
  const [isUsbConnecting, setIsUsbConnecting] = useState(false);
  const [usbStatusMessage, setUsbStatusMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('print'); // 'print', 'options', 'usb'

  // Customization toggles
  const [showTagline, setShowTagline] = useState(true);
  const [showCashier, setShowCashier] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showFooter, setShowFooter] = useState(true);

  const notify = useNotification();

  if (!sale) return null;

  // 1. Standard Browser / Online Print
  const handleSystemPrint = () => {
    window.print();
  };

  // 2. Direct USB Printing via WebUSB API
  const handleDirectUsbPrint = async () => {
    setIsUsbConnecting(true);
    setUsbStatusMessage(null);
    try {
      await printDirectWebUSB(sale, storeSettings, paperWidth);
      notify.success('Receipt sent directly to USB thermal printer!');
      setUsbStatusMessage({ type: 'success', text: 'Printed successfully via Direct USB connection.' });
    } catch (err) {
      const msg = err.message || 'Direct USB print error';
      notify.warning(msg);
      setUsbStatusMessage({
        type: 'error',
        text: `${msg}. Standard System Print works 100% reliably with all USB thermal printers.`,
      });
    } finally {
      setIsUsbConnecting(false);
    }
  };

  // 3. Copy Monospace Plain Text
  const handleCopyText = () => {
    const text = generatePlainTextReceipt(sale, storeSettings, paperWidth);
    navigator.clipboard.writeText(text);
    setCopied(true);
    notify.success('Formatted receipt copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  // 4. Send via WhatsApp
  const handleWhatsApp = () => {
    try {
      openWhatsAppReceipt(sale, storeSettings);
      notify.success('Opening WhatsApp with digital receipt!');
    } catch (err) {
      notify.error('Could not launch WhatsApp');
    }
  };

  // 5. Download Plain Text or Raw Binary ESC/POS File
  const handleDownloadText = () => {
    downloadReceiptFile(sale, storeSettings, paperWidth, false);
    notify.success('Downloaded receipt text file');
  };

  const handleDownloadEscPos = () => {
    downloadReceiptFile(sale, storeSettings, paperWidth, true);
    notify.success('Downloaded raw ESC/POS binary file (.bin)');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <span>Receipt Printing Suite</span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  #{sale.receiptNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Online browser print, Direct USB, WhatsApp e-receipt & offline exports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Tabs & Roll Selector */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Paper Size Selector */}
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <span>Roll Width:</span>
            <div className="inline-flex rounded-xl border border-slate-300 bg-white p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  paperWidth === '80mm'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                80 mm (Standard)
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  paperWidth === '58mm'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                58 mm (Compact)
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('a4')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  paperWidth === 'a4'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                A4 Invoice
              </button>
            </div>
          </div>

          {/* Quick Sharing & Export Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyText}
              title="Copy plain text receipt to clipboard"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleWhatsApp}
              title="Share receipt via WhatsApp"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export ▾</span>
              </button>
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 hidden group-hover:block group-focus-within:block z-20">
                <button
                  onClick={handleDownloadText}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700 text-xs flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download Text (.txt)</span>
                </button>
                <button
                  onClick={handleDownloadEscPos}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700 text-xs flex items-center gap-2"
                >
                  <Usb className="w-3.5 h-3.5 text-slate-500" />
                  <span>Raw ESC/POS (.bin)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: Receipt Preview & Customization Sidebar */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-200">
          {/* Scrollable Receipt Preview Container */}
          <div className="flex-1 p-4 overflow-y-auto flex justify-center items-start min-h-[300px]">
            <ThermalReceipt
              sale={sale}
              storeSettings={storeSettings}
              paperWidth={paperWidth}
              showTagline={showTagline}
              showCashier={showCashier}
              showBarcode={showBarcode}
              showFooter={showFooter}
            />
          </div>

          {/* Quick Options Drawer on the Right */}
          <div className="w-full md:w-64 bg-white p-3.5 border-t md:border-t-0 md:border-l border-slate-200 overflow-y-auto space-y-4 text-xs">
            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Print Options</span>
              </h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Print Copies:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPrintCopies(Math.max(1, printCopies - 1))}
                      className="w-6 h-6 rounded bg-slate-100 border border-slate-300 font-bold"
                    >
                      -
                    </button>
                    <span className="font-bold font-mono px-2">{printCopies}</span>
                    <button
                      type="button"
                      onClick={() => setPrintCopies(Math.min(5, printCopies + 1))}
                      className="w-6 h-6 rounded bg-slate-100 border border-slate-300 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={showBarcode}
                    onChange={(e) => setShowBarcode(e.target.checked)}
                    className="rounded text-brand-600"
                  />
                  <span className="text-slate-700">Receipt Verification Code</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCashier}
                    onChange={(e) => setShowCashier(e.target.checked)}
                    className="rounded text-brand-600"
                  />
                  <span className="text-slate-700">Show Cashier Name</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showFooter}
                    onChange={(e) => setShowFooter(e.target.checked)}
                    className="rounded text-brand-600"
                  />
                  <span className="text-slate-700">Show Return Policy</span>
                </label>
              </div>
            </div>

            {/* Direct USB Info Box */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                <Usb className="w-3.5 h-3.5 text-brand-600" />
                <span>Direct USB Printer</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Connect raw USB thermal printers (Xprinter, POS-58, POS-80, Epson) via WebUSB or standard system print dialog.
              </p>

              <button
                type="button"
                onClick={handleDirectUsbPrint}
                disabled={isUsbConnecting}
                className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Usb className="w-3.5 h-3.5" />
                <span>{isUsbConnecting ? 'Connecting USB...' : 'Send to USB Printer'}</span>
              </button>

              {usbStatusMessage && (
                <div
                  className={`p-2 rounded-lg text-[10px] leading-tight ${
                    usbStatusMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                  }`}
                >
                  {usbStatusMessage.text}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2.5">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-brand-600 shrink-0" />
            <span>
              Tip: Set browser print margins to <strong>None</strong> and size to <strong>{paperWidth}</strong> for exact alignment.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSystemPrint}
              className="inline-flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-500/20 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print System Receipt ({printCopies}x)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

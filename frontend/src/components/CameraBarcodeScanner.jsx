import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, RefreshCw, AlertCircle, Volume2, CheckCircle2 } from 'lucide-react';
import { playBeep, playErrorTone } from '../utils/soundEffects';

export default function CameraBarcodeScanner({ isOpen, onClose, onScan, title = 'Scan Product Barcode' }) {
  const [errorMessage, setErrorMessage] = useState('');
  const [scannedText, setScannedText] = useState('');
  const [continuous, setContinuous] = useState(true);
  const scannerRef = useRef(null);
  const elementId = 'interactive-camera-barcode-scanner';

  useEffect(() => {
    let html5QrCode = null;
    let isRunning = false;

    if (isOpen) {
      setErrorMessage('');
      setScannedText('');

      const initScanner = async () => {
        try {
          html5QrCode = new Html5Qrcode(elementId);
          scannerRef.current = html5QrCode;

          const config = {
            fps: 15,
            qrbox: { width: 280, height: 180 },
            aspectRatio: 1.333,
          };

          await html5QrCode.start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
              playBeep();
              setScannedText(decodedText);
              if (onScan) {
                onScan(decodedText);
              }
              if (!continuous) {
                setTimeout(() => {
                  if (onClose) onClose();
                }, 400);
              }
            },
            (errorMsg) => {
              // Ignore standard frame decoding misses
            }
          );
          isRunning = true;
        } catch (err) {
          console.error('Camera initialization error:', err);
          playErrorTone();
          setErrorMessage(
            err?.message ||
              'Unable to access camera. Please allow camera permissions or ensure another app is not using it.'
          );
        }
      };

      // Slight timeout to let DOM render element
      const timer = setTimeout(initScanner, 150);

      return () => {
        clearTimeout(timer);
        if (html5QrCode && isRunning) {
          html5QrCode
            .stop()
            .then(() => html5QrCode.clear())
            .catch((e) => console.debug('Camera stop error:', e));
        }
      };
    }
  }, [isOpen, continuous, onScan, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Point camera at barcode or QR code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera View Area */}
        <div className="relative bg-black min-h-[300px] flex items-center justify-center overflow-hidden">
          <div id={elementId} className="w-full h-full" />

          {/* Aiming Reticle Overlay */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-44 w-72 rounded-xl border-2 border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.35)]">
              <div className="absolute top-0 left-0 h-4 w-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl" />
              <div className="absolute top-0 right-0 h-4 w-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr" />
              <div className="absolute bottom-0 left-0 h-4 w-4 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl" />
              <div className="absolute bottom-0 right-0 h-4 w-4 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br" />
              {/* Laser scanning line animation */}
              <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-red-500/80 shadow-[0_0_8px_#ef4444] animate-pulse" />
            </div>
          </div>

          {errorMessage && (
            <div className="absolute inset-x-4 top-4 rounded-lg bg-red-900/90 p-3 text-white backdrop-blur-sm text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-300 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}
        </div>

        {/* Last Scanned Feedback Banner */}
        {scannedText && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border-t border-b border-emerald-200 dark:border-emerald-800 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-mono font-medium truncate">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              Scanned: <span className="font-bold underline">{scannedText}</span>
            </div>
            <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 px-2 py-0.5 rounded-full font-semibold">
              Added
            </span>
          </div>
        )}

        {/* Footer Controls */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300 font-medium">
            <input
              type="checkbox"
              checked={continuous}
              onChange={(e) => setContinuous(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Continuous scan mode
          </label>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

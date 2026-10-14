import { useState, useEffect } from 'react';
import {
  Clock,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  Printer,
  History,
  Lock,
  Unlock,
  CheckCircle2,
  X,
  CreditCard,
  QrCode,
  Users,
} from 'lucide-react';
import api from '../api/client';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { playSuccessTone, playErrorTone } from '../utils/soundEffects';

export default function Shifts() {
  const [currentShift, setCurrentShift] = useState(null);
  const [shiftHistory, setShiftHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showStartModal, setShowStartModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showZReportModal, setShowZReportModal] = useState(false);
  const [selectedZReport, setSelectedZReport] = useState(null);

  // Forms
  const [openingCash, setOpeningCash] = useState(5000);
  const [openingNotes, setOpeningNotes] = useState('');
  const [actualCashCounted, setActualCashCounted] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [movementForm, setMovementForm] = useState({
    type: 'CASH_IN',
    amount: '',
    reason: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchShiftData = async () => {
    try {
      setLoading(true);
      const [currRes, histRes] = await Promise.all([
        api.get('/shifts/current'),
        api.get('/shifts?limit=15'),
      ]);

      if (currRes.data.success) {
        setCurrentShift(currRes.data.data);
      }
      if (histRes.data.success) {
        setShiftHistory(histRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching shifts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShiftData();
  }, []);

  const handleStartShift = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await api.post('/shifts/start', {
        openingCash: Number(openingCash) || 0,
        openingNotes,
      });
      if (res.data.success) {
        playSuccessTone();
        setSuccessMsg('Register drawer shift opened successfully!');
        setShowStartModal(false);
        fetchShiftData();
      }
    } catch (err) {
      playErrorTone();
      setErrorMsg(err.response?.data?.message || 'Failed to open shift');
    }
  };

  const handleCashMovement = async (e) => {
    e.preventDefault();
    if (!currentShift) return;
    setErrorMsg('');
    try {
      const res = await api.post(`/shifts/${currentShift._id}/cash-movement`, movementForm);
      if (res.data.success) {
        playSuccessTone();
        setSuccessMsg(res.data.message);
        setShowMovementModal(false);
        setMovementForm({ type: 'CASH_IN', amount: '', reason: '' });
        fetchShiftData();
      }
    } catch (err) {
      playErrorTone();
      setErrorMsg(err.response?.data?.message || 'Failed to record movement');
    }
  };

  const handleCloseShift = async (e) => {
    e.preventDefault();
    if (!currentShift) return;
    setErrorMsg('');
    try {
      const res = await api.post(`/shifts/${currentShift._id}/close`, {
        actualCash: Number(actualCashCounted) || 0,
        closingNotes,
      });
      if (res.data.success) {
        playSuccessTone();
        setSuccessMsg('Shift closed successfully! Day-End Z-Report generated.');
        setShowCloseModal(false);
        setSelectedZReport(res.data.data);
        setShowZReportModal(true);
        fetchShiftData();
      }
    } catch (err) {
      playErrorTone();
      setErrorMsg(err.response?.data?.message || 'Failed to close shift');
    }
  };

  const handlePrintZReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="h-7 w-7 text-primary-600" />
            Cash Register Shifts & Day-End Z-Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cash drawer float balancing, petty cash movements, and end-of-day register audit
          </p>
        </div>

        {currentShift ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setErrorMsg('');
                setShowMovementModal(true);
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
            >
              Cash In / Out
            </button>
            <button
              onClick={() => {
                setErrorMsg('');
                setActualCashCounted(currentShift.expectedCash || 0);
                setShowCloseModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-lg shadow-red-600/20 transition-colors"
            >
              <Lock className="h-4 w-4" />
              Close Shift (Z-Report)
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setErrorMsg('');
              setShowStartModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition-colors"
          >
            <Unlock className="h-4 w-4" />
            Open Cash Register Shift
          </button>
        )}
      </div>

      {successMsg && (
        <div className="no-print rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Active Shift Dashboard */}
      {currentShift ? (
        <div className="no-print space-y-4">
          {/* Main Active Banner */}
          <div className="rounded-2xl border-2 border-emerald-500/40 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-bold">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Shift Open
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                  Cashier: {currentShift.cashierName}
                </h2>
                <p className="text-xs text-slate-500">
                  Opened: {formatDateTime(currentShift.openedAt)}
                </p>
              </div>

              {/* Expected Drawer Cash Display */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 p-4 text-right">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Expected Cash in Drawer Right Now
                </div>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                  {formatCurrency(currentShift.expectedCash || currentShift.openingCash)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Opening Float: {formatCurrency(currentShift.openingCash)}
                </div>
              </div>
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-5">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-850 p-3">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Cash Sales</div>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
                  {formatCurrency(currentShift.summary?.cashSales || 0)}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-850 p-3">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Card Sales</div>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
                  {formatCurrency(currentShift.summary?.cardSales || 0)}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-850 p-3">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Raast Instant</div>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
                  {formatCurrency(currentShift.summary?.raastSales || 0)}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-850 p-3">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Wallets / Bank</div>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
                  {formatCurrency(currentShift.summary?.digitalSales || 0)}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-850 p-3">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Khata Udhaar</div>
                <div className="text-base font-bold text-amber-600 mt-1 font-mono">
                  {formatCurrency(currentShift.summary?.creditSales || 0)}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-850 p-3">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Repayments Received</div>
                <div className="text-base font-bold text-emerald-600 mt-1 font-mono">
                  {formatCurrency(currentShift.summary?.customerPaymentsReceived || 0)}
                </div>
              </div>
            </div>

            {/* Petty Cash In / Out Log */}
            {currentShift.cashMovements?.length > 0 && (
              <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Shift Drawer Movements (Petty Cash & Float Adjustments)
                </div>
                <div className="space-y-1.5">
                  {currentShift.cashMovements.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-850"
                    >
                      <div className="flex items-center gap-2">
                        {m.type === 'CASH_IN' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                            <ArrowDownLeft className="h-3.5 w-3.5" /> Cash In
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 font-bold text-[11px]">
                            <ArrowUpRight className="h-3.5 w-3.5" /> Cash Out
                          </span>
                        )}
                        <span className="text-slate-600 dark:text-slate-300">{m.reason}</span>
                      </div>
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {m.type === 'CASH_IN' ? '+' : '-'} {formatCurrency(m.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* No active shift banner */
        <div className="no-print rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 p-10 text-center">
          <Lock className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">
            No Cash Register Shift Is Currently Open
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Opening a register shift tracks drawer opening float, cash sales, digital transfers, and petty cash
            with complete Day-End balancing.
          </p>
          <button
            onClick={() => {
              setErrorMsg('');
              setShowStartModal(true);
            }}
            className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-lg shadow-emerald-600/20"
          >
            <Unlock className="h-4 w-4" />
            Open Register Shift Now
          </button>
        </div>
      )}

      {/* Past Shifts & Z-Reports History */}
      <div className="no-print rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <History className="h-4 w-4 text-primary-600" />
              Previous Shift Closures & Z-Reports
            </h3>
            <p className="text-[11px] text-slate-400">Day-end audit history and drawer discrepancy records</p>
          </div>
        </div>

        {shiftHistory.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">No previous shifts recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Opened / Closed</th>
                  <th className="p-3.5">Cashier</th>
                  <th className="p-3.5">Opening Float</th>
                  <th className="p-3.5">Total Sales</th>
                  <th className="p-3.5">Expected vs Actual</th>
                  <th className="p-3.5">Discrepancy</th>
                  <th className="p-3.5 text-right">Z-Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {shiftHistory.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      <div className="font-semibold">{formatDateTime(s.openedAt)}</div>
                      <div className="text-[10px] text-slate-400">
                        {s.closedAt ? `Closed: ${formatDateTime(s.closedAt)}` : 'STILL OPEN'}
                      </div>
                    </td>

                    <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200">{s.cashierName}</td>

                    <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">
                      {formatCurrency(s.openingCash)}
                    </td>

                    <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(s.summary?.totalSalesAmount || 0)}
                    </td>

                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                      Exp: {formatCurrency(s.expectedCash)} / Act: {formatCurrency(s.actualCash)}
                    </td>

                    <td className="p-3.5">
                      {s.status === 'OPEN' ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          OPEN
                        </span>
                      ) : s.cashDifference === 0 ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          Balanced (Rs. 0)
                        </span>
                      ) : s.cashDifference > 0 ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                          Over +{formatCurrency(s.cashDifference)}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold">
                          Short -{formatCurrency(Math.abs(s.cashDifference))}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedZReport(s);
                          setShowZReportModal(true);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 ml-auto"
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Start Shift */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Unlock className="h-5 w-5 text-emerald-600" />
                Open Cash Drawer Shift
              </h3>
              <button
                onClick={() => setShowStartModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleStartShift} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 text-xs rounded-xl bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Opening Cash Float in Drawer (PKR) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="w-full text-base font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Count coins and small bills present before taking customer payments.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Opening Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Received float from morning safe"
                  value={openingNotes}
                  onChange={(e) => setOpeningNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStartModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
                >
                  Start Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cash In / Out */}
      {showMovementModal && currentShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Drawer Cash Movement</h3>
              <button
                onClick={() => setShowMovementModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCashMovement} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 text-xs rounded-xl bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMovementForm({ ...movementForm, type: 'CASH_IN' })}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                    movementForm.type === 'CASH_IN'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  + Cash In (Add)
                </button>
                <button
                  type="button"
                  onClick={() => setMovementForm({ ...movementForm, type: 'CASH_OUT' })}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                    movementForm.type === 'CASH_OUT'
                      ? 'border-red-500 bg-red-50 text-red-800'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  - Cash Out (Withdraw)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount (PKR) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={movementForm.amount}
                  onChange={(e) => setMovementForm({ ...movementForm, amount: e.target.value })}
                  className="w-full text-base font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason / Purpose *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Milk & tea expenses, bank drop, extra 50 Rs notes"
                  value={movementForm.reason}
                  onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md"
                >
                  Save Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Close Shift */}
      {showCloseModal && currentShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Lock className="h-5 w-5 text-red-600" />
                Close Shift & Generate Z-Report
              </h3>
              <button
                onClick={() => setShowCloseModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCloseShift} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 text-xs rounded-xl bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                  {errorMsg}
                </div>
              )}

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Expected Drawer Cash:</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-slate-100">
                    {formatCurrency(currentShift.expectedCash)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Actual Physical Cash Counted in Drawer (PKR) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={actualCashCounted}
                  onChange={(e) => setActualCashCounted(e.target.value)}
                  className="w-full text-lg font-black px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
                {actualCashCounted !== '' && (
                  <div className="mt-2 text-xs font-semibold">
                    {Number(actualCashCounted) - currentShift.expectedCash === 0 ? (
                      <span className="text-emerald-600">✓ Drawer balances exactly with zero discrepancy.</span>
                    ) : Number(actualCashCounted) - currentShift.expectedCash > 0 ? (
                      <span className="text-blue-600">
                        + Cash Over by {formatCurrency(Number(actualCashCounted) - currentShift.expectedCash)}
                      </span>
                    ) : (
                      <span className="text-red-600">
                        ⚠ Cash Short by {formatCurrency(Math.abs(Number(actualCashCounted) - currentShift.expectedCash))}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Closing Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Notes about register handover or variances"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md"
                >
                  Confirm Close & Generate Z-Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Day-End Z-Report Modal */}
      {showZReportModal && selectedZReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="no-print flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary-600" />
                Day-End Z-Report
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintZReport}
                  className="p-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100"
                  title="Print Report"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowZReportModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Z-Report Paper View (Thermal 80mm format) */}
            <div className="p-6 overflow-y-auto font-mono text-xs text-slate-900 dark:text-slate-100 space-y-4">
              <div className="text-center border-b border-dashed border-slate-300 pb-3">
                <div className="font-black text-sm uppercase">ShopEase POS</div>
                <div className="text-[11px] text-slate-500">Day-End Financial Z-Report</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Opened: {formatDateTime(selectedZReport.openedAt)}
                </div>
                <div className="text-[10px] text-slate-400">
                  Closed: {formatDateTime(selectedZReport.closedAt || new Date())}
                </div>
                <div className="text-[10px] text-slate-400">Cashier: {selectedZReport.cashierName}</div>
              </div>

              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
                <div className="font-bold text-[11px] uppercase">Sales Breakdown</div>
                <div className="flex justify-between">
                  <span>Completed Sales:</span>
                  <span>{selectedZReport.summary?.totalSalesCount || 0}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Gross Sales Total:</span>
                  <span>{formatCurrency(selectedZReport.summary?.totalSalesAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>- Cash Sales:</span>
                  <span>{formatCurrency(selectedZReport.summary?.cashSales || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>- Card Sales:</span>
                  <span>{formatCurrency(selectedZReport.summary?.cardSales || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>- Raast Instant:</span>
                  <span>{formatCurrency(selectedZReport.summary?.raastSales || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>- Digital Wallets:</span>
                  <span>{formatCurrency(selectedZReport.summary?.digitalSales || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>- Khata (Udhaar) Sales:</span>
                  <span>{formatCurrency(selectedZReport.summary?.creditSales || 0)}</span>
                </div>
              </div>

              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
                <div className="font-bold text-[11px] uppercase">Cash Drawer Audit</div>
                <div className="flex justify-between">
                  <span>Opening Float:</span>
                  <span>{formatCurrency(selectedZReport.openingCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span>+ Cash Sales:</span>
                  <span>+{formatCurrency(selectedZReport.summary?.cashSales || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>+ Khata Repayments:</span>
                  <span>+{formatCurrency(selectedZReport.summary?.customerPaymentsReceived || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>+ Cash In:</span>
                  <span>+{formatCurrency(selectedZReport.summary?.cashInAmount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>- Cash Out:</span>
                  <span>-{formatCurrency(selectedZReport.summary?.cashOutAmount || 0)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-slate-200 pt-1">
                  <span>Expected Drawer Cash:</span>
                  <span>{formatCurrency(selectedZReport.expectedCash)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Actual Cash Counted:</span>
                  <span>{formatCurrency(selectedZReport.actualCash)}</span>
                </div>
                <div
                  className={`flex justify-between font-black text-sm pt-1 border-t border-dashed border-slate-300 ${
                    selectedZReport.cashDifference === 0
                      ? 'text-emerald-600'
                      : selectedZReport.cashDifference > 0
                      ? 'text-blue-600'
                      : 'text-red-600'
                  }`}
                >
                  <span>Difference:</span>
                  <span>
                    {selectedZReport.cashDifference > 0 ? '+' : ''}
                    {formatCurrency(selectedZReport.cashDifference)}
                  </span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 pt-2">
                <div>ShopEase POS System Z-Report</div>
                <div>Authorized Sign: __________________</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

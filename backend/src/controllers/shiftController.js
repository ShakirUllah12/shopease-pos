const Shift = require('../models/Shift');
const Sale = require('../models/Sale');
const CustomerLedger = require('../models/CustomerLedger');

// Helper to compute live shift totals
async function calculateShiftMetrics(shift) {
  const startTime = shift.openedAt;
  const endTime = shift.closedAt || new Date();

  // Find all sales in this shift timeframe
  const sales = await Sale.find({
    createdAt: { $gte: startTime, $lte: endTime },
  });

  let totalSalesAmount = 0;
  let cashSales = 0;
  let cardSales = 0;
  let raastSales = 0;
  let digitalSales = 0;
  let creditSales = 0;
  let refundsCount = 0;
  let refundsAmount = 0;
  let completedSalesCount = 0;

  for (const s of sales) {
    if (s.status === 'REFUNDED') {
      refundsCount += 1;
      refundsAmount += s.totalAmount || 0;
      continue;
    }

    completedSalesCount += 1;
    totalSalesAmount += s.totalAmount || 0;

    if (s.paymentMethod === 'cash') {
      cashSales += s.totalAmount || 0;
    } else if (s.paymentMethod === 'card') {
      cardSales += s.totalAmount || 0;
    } else if (s.paymentMethod === 'raast') {
      raastSales += s.totalAmount || 0;
    } else if (s.paymentMethod === 'credit') {
      creditSales += s.totalAmount || 0;
    } else if (['jazzcash', 'easypaisa', 'bank'].includes(s.paymentMethod)) {
      digitalSales += s.totalAmount || 0;
    } else if (s.paymentMethod === 'split' && Array.isArray(s.splitPayments)) {
      for (const sp of s.splitPayments) {
        if (sp.method === 'cash') cashSales += sp.amount || 0;
        else if (sp.method === 'card') cardSales += sp.amount || 0;
        else if (sp.method === 'raast') raastSales += sp.amount || 0;
        else if (sp.method === 'credit') creditSales += sp.amount || 0;
        else digitalSales += sp.amount || 0;
      }
    }
  }

  // Find customer Khata repayments received in cash during this shift
  const paymentsReceived = await CustomerLedger.find({
    type: 'PAYMENT_RECEIVED',
    paymentMethod: 'cash',
    createdAt: { $gte: startTime, $lte: endTime },
  });

  const customerPaymentsReceived = paymentsReceived.reduce((acc, p) => acc + (p.amount || 0), 0);

  // Cash In and Cash Out movements
  let cashInAmount = 0;
  let cashOutAmount = 0;
  for (const m of shift.cashMovements || []) {
    if (m.type === 'CASH_IN') cashInAmount += m.amount || 0;
    if (m.type === 'CASH_OUT') cashOutAmount += m.amount || 0;
  }

  const expectedCash =
    Number(shift.openingCash || 0) +
    Number(cashSales) +
    Number(customerPaymentsReceived) +
    Number(cashInAmount) -
    Number(cashOutAmount) -
    Number(refundsAmount);

  return {
    summary: {
      totalSalesCount: completedSalesCount,
      totalSalesAmount,
      cashSales,
      cardSales,
      raastSales,
      digitalSales,
      creditSales,
      customerPaymentsReceived,
      cashInAmount,
      cashOutAmount,
      refundsCount,
      refundsAmount,
    },
    expectedCash,
  };
}

// GET /api/shifts/current
exports.getCurrentShift = async (req, res, next) => {
  try {
    const shift = await Shift.findOne({
      cashierId: req.user._id,
      status: 'OPEN',
    }).sort({ openedAt: -1 });

    if (!shift) {
      return res.json({
        success: true,
        data: null,
        message: 'No open shift for current user',
      });
    }

    const { summary, expectedCash } = await calculateShiftMetrics(shift);

    res.json({
      success: true,
      data: {
        ...shift.toObject(),
        summary,
        expectedCash,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/shifts/start
exports.startShift = async (req, res, next) => {
  try {
    const { openingCash = 0, openingNotes = '' } = req.body;

    const existingOpenShift = await Shift.findOne({
      cashierId: req.user._id,
      status: 'OPEN',
    });

    if (existingOpenShift) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active open shift. Please close it before starting a new one.',
      });
    }

    const shift = await Shift.create({
      cashierId: req.user._id,
      cashierName: req.user.name || 'Staff',
      openingCash: Number(openingCash) || 0,
      expectedCash: Number(openingCash) || 0,
      openingNotes,
      status: 'OPEN',
      openedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Cash drawer shift opened successfully',
      data: shift,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/shifts/:id/cash-movement
exports.recordCashMovement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, amount, reason } = req.body;

    if (!['CASH_IN', 'CASH_OUT'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid movement type. Must be CASH_IN or CASH_OUT' });
    }
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Reason for cash movement is required' });
    }

    const shift = await Shift.findById(id);
    if (!shift) {
      return res.status(400).json({ success: false, message: 'Shift not found' });
    }
    if (shift.status !== 'OPEN') {
      return res.status(400).json({ success: false, message: 'Cannot record cash movement on a closed shift' });
    }

    shift.cashMovements.push({
      type,
      amount: Number(amount),
      reason: reason.trim(),
      recordedBy: req.user.name || 'Staff',
      createdAt: new Date(),
    });

    const { summary, expectedCash } = await calculateShiftMetrics(shift);
    shift.summary = summary;
    shift.expectedCash = expectedCash;

    await shift.save();

    res.json({
      success: true,
      message: `${type === 'CASH_IN' ? 'Cash added' : 'Cash withdrawn'} successfully`,
      data: shift,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/shifts/:id/close
exports.closeShift = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { actualCash = 0, closingNotes = '' } = req.body;

    const shift = await Shift.findById(id);
    if (!shift) {
      return res.status(404).json({ success: false, message: 'Shift not found' });
    }
    if (shift.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Shift is already closed' });
    }

    shift.closedAt = new Date();
    const { summary, expectedCash } = await calculateShiftMetrics(shift);

    const actual = Number(actualCash) || 0;
    const difference = actual - expectedCash;

    shift.actualCash = actual;
    shift.expectedCash = expectedCash;
    shift.cashDifference = difference;
    shift.summary = summary;
    shift.closingNotes = closingNotes;
    shift.status = 'CLOSED';

    await shift.save();

    res.json({
      success: true,
      message: 'Shift closed successfully. Day-End Z-Report generated.',
      data: shift,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/shifts
exports.getShiftHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, cashierId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (cashierId) query.cashierId = cashierId;

    const skip = (Number(page) - 1) * Number(limit);

    const [shifts, total] = await Promise.all([
      Shift.find(query).sort({ openedAt: -1 }).skip(skip).limit(Number(limit)),
      Shift.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: shifts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/shifts/:id
exports.getShiftById = async (req, res, next) => {
  try {
    const shift = await Shift.findById(req.params.id);
    if (!shift) {
      return res.status(404).json({ success: false, message: 'Shift not found' });
    }

    res.json({
      success: true,
      data: shift,
    });
  } catch (err) {
    next(err);
  }
};

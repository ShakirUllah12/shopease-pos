const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema(
  {
    cashierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cashierName: {
      type: String,
      required: true,
      trim: true,
    },
    openedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    openingCash: {
      type: Number,
      required: true,
      min: 0,
    },
    expectedCash: {
      type: Number,
      default: 0,
    },
    actualCash: {
      type: Number,
      default: 0,
    },
    cashDifference: {
      type: Number,
      default: 0,
    },
    summary: {
      totalSalesCount: { type: Number, default: 0 },
      totalSalesAmount: { type: Number, default: 0 },
      cashSales: { type: Number, default: 0 },
      cardSales: { type: Number, default: 0 },
      raastSales: { type: Number, default: 0 },
      digitalSales: { type: Number, default: 0 },
      creditSales: { type: Number, default: 0 },
      customerPaymentsReceived: { type: Number, default: 0 },
      cashInAmount: { type: Number, default: 0 },
      cashOutAmount: { type: Number, default: 0 },
      refundsCount: { type: Number, default: 0 },
      refundsAmount: { type: Number, default: 0 },
    },
    cashMovements: [
      {
        type: {
          type: String,
          enum: ['CASH_IN', 'CASH_OUT'],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        reason: {
          type: String,
          required: true,
          trim: true,
        },
        recordedBy: {
          type: String,
          default: 'Staff',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    openingNotes: {
      type: String,
      default: '',
      trim: true,
    },
    closingNotes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

shiftSchema.index({ status: 1, openedAt: -1 });

const Shift = mongoose.model('Shift', shiftSchema);
module.exports = Shift;

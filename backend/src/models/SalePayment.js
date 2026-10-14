const mongoose = require('mongoose');
const { PAYMENT_METHODS } = require('../config/constants');

const salePaymentSchema = new mongoose.Schema(
  {
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      required: true,
      index: true,
    },
    method: {
      type: String,
      enum: PAYMENT_METHODS,
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be greater than zero'],
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: '',
    },
    note: {
      type: String,
      default: '',
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const SalePayment = mongoose.model('SalePayment', salePaymentSchema);
module.exports = SalePayment;

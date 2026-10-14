const mongoose = require('mongoose');

const customerLedgerSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['SALE_CREDIT', 'PAYMENT_RECEIVED', 'REFUND_REVERSAL', 'ADJUSTMENT', 'OPENING_BALANCE'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    previousBalance: {
      type: Number,
      required: true,
    },
    newBalance: {
      type: Number,
      required: true,
    },
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
    },
    receiptNumber: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: 'cash',
    },
    referenceNumber: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    recordedByName: {
      type: String,
      default: 'Staff',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

customerLedgerSchema.index({ customerId: 1, createdAt: -1 });

const CustomerLedger = mongoose.model('CustomerLedger', customerLedgerSchema);
module.exports = CustomerLedger;

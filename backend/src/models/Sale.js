const mongoose = require('mongoose');
const { SALE_STATUS, PAYMENT_STATUS } = require('../config/constants');

const saleItemSnapshotSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    categoryName: {
      type: String,
      default: '',
    },
    sku: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '',
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    cashierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cashierName: {
      type: String,
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      index: true,
    },
    customerName: {
      type: String,
      trim: true,
      default: 'Walk-in Customer',
    },
    customerPhone: {
      type: String,
      trim: true,
      default: '',
    },
    items: [saleItemSnapshotSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    orderDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },
    changeGiven: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PAID,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(SALE_STATUS),
      default: SALE_STATUS.COMPLETED,
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to populate payments
saleSchema.virtual('payments', {
  ref: 'SalePayment',
  localField: '_id',
  foreignField: 'saleId',
});

// Virtual to calculate total cost of goods sold (COGS) for this sale
saleSchema.virtual('totalCostOfGoodsSold').get(function () {
  if (!this.items) return 0;
  return this.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
});

// Virtual for Gross Profit
saleSchema.virtual('grossProfit').get(function () {
  const cogs = this.totalCostOfGoodsSold || 0;
  return Math.round((this.totalAmount - cogs) * 100) / 100;
});

const Sale = mongoose.model('Sale', saleSchema);
module.exports = Sale;

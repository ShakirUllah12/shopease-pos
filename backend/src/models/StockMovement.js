const mongoose = require('mongoose');
const { STOCK_MOVEMENT_TYPE } = require('../config/constants');

const stockMovementSchema = new mongoose.Schema(
  {
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(STOCK_MOVEMENT_TYPE),
      required: true,
      index: true,
    },
    quantityChange: {
      type: Number,
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    referenceType: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      required: [true, 'Adjustment reason is required'],
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdByName: {
      type: String,
      default: 'System',
    },
  },
  {
    timestamps: true,
  }
);

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
module.exports = StockMovement;

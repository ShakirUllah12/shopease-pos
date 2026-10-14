const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Parent product is required'],
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    barcode: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
    variantName: {
      type: String,
      default: 'Default',
      trim: true,
    },
    size: {
      type: String,
      trim: true,
      default: '',
    },
    color: {
      type: String,
      trim: true,
      default: '',
    },
    costPrice: {
      type: Number,
      required: [true, 'Purchase cost price is required'],
      min: [0, 'Cost price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Stock quantity cannot be negative'],
    },
    currentStock: {
      type: Number,
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: [0, 'Low stock threshold cannot be negative'],
    },
    minStockAlert: {
      type: Number,
      default: 5,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Synchronize stockQuantity <-> currentStock and lowStockThreshold <-> minStockAlert
productVariantSchema.pre('validate', function (next) {
  if (this.stockQuantity !== undefined && this.currentStock === undefined) {
    this.currentStock = this.stockQuantity;
  } else if (this.currentStock !== undefined && this.stockQuantity === undefined) {
    this.stockQuantity = this.currentStock;
  } else if (this.isModified('stockQuantity')) {
    this.currentStock = this.stockQuantity;
  } else if (this.isModified('currentStock')) {
    this.stockQuantity = this.currentStock;
  }

  if (this.lowStockThreshold !== undefined && this.minStockAlert === undefined) {
    this.minStockAlert = this.lowStockThreshold;
  } else if (this.minStockAlert !== undefined && this.lowStockThreshold === undefined) {
    this.lowStockThreshold = this.minStockAlert;
  } else if (this.isModified('lowStockThreshold')) {
    this.minStockAlert = this.lowStockThreshold;
  } else if (this.isModified('minStockAlert')) {
    this.lowStockThreshold = this.minStockAlert;
  }

  next();
});

// Virtual property to calculate gross profit margin
productVariantSchema.virtual('profitMargin').get(function () {
  if (this.sellingPrice && this.costPrice) {
    return Math.round((this.sellingPrice - this.costPrice) * 100) / 100;
  }
  return 0;
});

// Check if stock is low
productVariantSchema.virtual('isLowStock').get(function () {
  const stock = this.stockQuantity !== undefined ? this.stockQuantity : this.currentStock;
  const threshold = this.lowStockThreshold !== undefined ? this.lowStockThreshold : this.minStockAlert;
  return stock <= threshold;
});

const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);
module.exports = ProductVariant;

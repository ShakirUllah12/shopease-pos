const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    categoryName: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    isClothing: {
      type: Boolean,
      default: false,
    },
    trackStock: {
      type: Boolean,
      default: true,
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

// Virtual to populate variants
productSchema.virtual('variants', {
  ref: 'ProductVariant',
  localField: '_id',
  foreignField: 'productId',
});

// Text index for fast search by name
productSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;

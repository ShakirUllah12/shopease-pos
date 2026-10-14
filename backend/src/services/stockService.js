const ProductVariant = require('../models/ProductVariant');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Setting = require('../models/Setting');
const { STOCK_MOVEMENT_TYPE } = require('../config/constants');

/**
 * Adjusts inventory stock for a variant and writes an immutable StockMovement audit record.
 * 
 * @param {Object} params
 * @param {string|ObjectId} params.variantId
 * @param {number} params.quantityChange - Positive (addition) or negative (deduction)
 * @param {string} params.type - One of STOCK_MOVEMENT_TYPE
 * @param {string} params.reason - Human-readable explanation
 * @param {string|ObjectId} [params.referenceId] - Sale._id or Purchase._id
 * @param {string} [params.referenceType] - 'Sale', 'Purchase', etc.
 * @param {Object} [params.user] - The acting user object { _id, fullName, username }
 * @param {ClientSession} [params.session] - Optional Mongoose transaction session
 */
async function modifyVariantStock({
  variantId,
  quantityChange,
  type,
  reason,
  referenceId,
  referenceType,
  user,
  session = null,
}) {
  const query = ProductVariant.findById(variantId);
  if (session) query.session(session);
  const variant = await query;

  if (!variant) {
    throw new Error(`Product variant ${variantId} not found`);
  }

  const prodQuery = Product.findById(variant.productId);
  if (session) prodQuery.session(session);
  const product = await prodQuery;

  // Check if stock tracking is disabled on parent product
  if (product && !product.trackStock) {
    return {
      success: true,
      untracked: true,
      variant,
    };
  }

  // Check negative stock constraint
  const setting = await Setting.findOne();
  const allowNegative = setting ? setting.allowNegativeStock : false;

  const previousStock = variant.currentStock || 0;
  const newStock = previousStock + quantityChange;

  if (newStock < 0 && !allowNegative) {
    throw new Error(
      `Insufficient stock for "${product ? product.name : variant.sku}" (${variant.variantName || variant.sku}). Available: ${previousStock}, Requested change: ${quantityChange}`
    );
  }

  variant.currentStock = newStock;
  variant.stockQuantity = newStock;
  await variant.save({ session });

  // Record Stock Movement Audit
  const movementData = {
    variantId: variant._id,
    productId: product ? product._id : variant.productId,
    productName: product ? product.name : 'Unknown Product',
    sku: variant.sku,
    type,
    quantityChange,
    previousStock,
    newStock,
    referenceId,
    referenceType,
    reason,
    createdBy: user ? user._id : undefined,
    createdByName: user ? (user.fullName || user.username) : 'System',
  };

  if (session) {
    await StockMovement.create([movementData], { session });
  } else {
    await StockMovement.create(movementData);
  }

  return {
    success: true,
    previousStock,
    newStock,
    variant,
  };
}

module.exports = {
  modifyVariantStock,
};

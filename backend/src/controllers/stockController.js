const ProductVariant = require('../models/ProductVariant');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { modifyVariantStock } = require('../services/stockService');
const { STOCK_MOVEMENT_TYPE } = require('../config/constants');

/**
 * Manually adjust stock for a variant (Owner only)
 */
async function manualAdjustStock(req, res, next) {
  try {
    const { variantId, quantityChange, reason } = req.body;

    if (!variantId) {
      return res.status(400).json({ success: false, message: 'Variant ID is required' });
    }

    if (!quantityChange || isNaN(Number(quantityChange)) || Number(quantityChange) === 0) {
      return res.status(400).json({
        success: false,
        message: 'A non-zero quantity change (positive to add, negative to deduct) is required',
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory reason is required for manual stock adjustments',
      });
    }

    const result = await modifyVariantStock({
      variantId,
      quantityChange: Number(quantityChange),
      type: STOCK_MOVEMENT_TYPE.MANUAL_ADJUSTMENT,
      reason: reason.trim(),
      user: req.user,
    });

    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get audit log of stock movements with filtering
 */
async function getStockMovements(req, res, next) {
  try {
    const {
      variantId,
      type,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    if (variantId) {
      filter.variantId = variantId;
    }

    if (type) {
      filter.type = type;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [movements, totalCount] = await Promise.all([
      StockMovement.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      StockMovement.countDocuments(filter),
    ]);

    res.json({
      success: true,
      totalCount,
      page: parseInt(page, 10),
      totalPages: Math.ceil(totalCount / take),
      movements,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get low-stock variants across the entire catalog
 */
async function getLowStockAlerts(req, res, next) {
  try {
    // Find all variants where currentStock <= minStockAlert and active
    const lowStockVariants = await ProductVariant.find({
      isActive: true,
      $expr: { $lte: ['$currentStock', '$minStockAlert'] },
    })
      .populate('productId', 'name categoryName isClothing')
      .sort({ currentStock: 1 })
      .lean();

    res.json({
      success: true,
      count: lowStockVariants.length,
      lowStockVariants,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Overall Inventory Valuation & Summary
 */
async function getInventorySummary(req, res, next) {
  try {
    const variants = await ProductVariant.find({ isActive: true }).lean();

    let totalStockUnits = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let lowStockCount = 0;

    variants.forEach((v) => {
      const stock = Math.max(0, v.currentStock || 0);
      totalStockUnits += stock;
      totalCostValuation += stock * (v.costPrice || 0);
      totalRetailValuation += stock * (v.sellingPrice || 0);
      if (stock <= v.minStockAlert) {
        lowStockCount++;
      }
    });

    res.json({
      success: true,
      summary: {
        totalVariants: variants.length,
        totalStockUnits,
        totalCostValuation: Math.round(totalCostValuation * 100) / 100,
        totalRetailValuation: Math.round(totalRetailValuation * 100) / 100,
        potentialProfit: Math.round((totalRetailValuation - totalCostValuation) * 100) / 100,
        lowStockCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  manualAdjustStock,
  getStockMovements,
  getLowStockAlerts,
  getInventorySummary,
};

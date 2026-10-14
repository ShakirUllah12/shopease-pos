const Purchase = require('../models/Purchase');
const Supplier = require('../models/Supplier');
const ProductVariant = require('../models/ProductVariant');
const Product = require('../models/Product');
const { modifyVariantStock } = require('../services/stockService');
const { PURCHASE_STATUS, PAYMENT_STATUS, STOCK_MOVEMENT_TYPE } = require('../config/constants');

/**
 * Generate a unique Purchase Order number (PO-YYYYMMDD-XXXX)
 */
async function generatePurchaseNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `PO-${dateStr}`;
  const latest = await Purchase.findOne({
    purchaseNumber: new RegExp(`^${prefix}`),
  }).sort({ purchaseNumber: -1 });

  let seq = 1;
  if (latest && latest.purchaseNumber) {
    const parts = latest.purchaseNumber.split('-');
    if (parts.length === 3) {
      seq = parseInt(parts[2], 10) + 1;
    }
  }
  return `${prefix}-${String(seq).padStart(4, '0')}`;
}

/**
 * Create a new Purchase order
 */
async function createPurchase(req, res, next) {
  try {
    const {
      supplierId,
      items,
      amountPaid = 0,
      status = PURCHASE_STATUS.ORDERED,
      notes = '',
    } = req.body;

    if (!supplierId) {
      return res.status(400).json({ success: false, message: 'Supplier is required' });
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Purchase items are required' });
    }

    // Process & validate items
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const variant = await ProductVariant.findById(item.variantId);
      if (!variant) {
        return res.status(400).json({ success: false, message: `Variant ${item.variantId} not found` });
      }
      const product = await Product.findById(variant.productId);

      const qty = Number(item.quantity);
      const unitCost = Number(item.unitCost !== undefined ? item.unitCost : variant.costPrice);

      if (qty <= 0 || unitCost < 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid quantity or cost price in purchase items',
        });
      }

      const lineTotal = Math.round(qty * unitCost * 100) / 100;
      totalAmount += lineTotal;

      processedItems.push({
        productId: variant.productId,
        variantId: variant._id,
        productName: product ? product.name : 'Unknown Product',
        sku: variant.sku,
        size: variant.size || '',
        color: variant.color || '',
        unitCost,
        quantity: qty,
        lineTotal,
      });
    }

    totalAmount = Math.round(totalAmount * 100) / 100;
    const paid = Math.min(totalAmount, Math.max(0, Number(amountPaid) || 0));

    let paymentStatus = PAYMENT_STATUS.UNPAID;
    if (paid >= totalAmount) {
      paymentStatus = PAYMENT_STATUS.PAID;
    } else if (paid > 0) {
      paymentStatus = PAYMENT_STATUS.PARTIAL;
    }

    const purchaseNumber = await generatePurchaseNumber();

    const isReceived = status === PURCHASE_STATUS.RECEIVED;

    const purchase = await Purchase.create({
      purchaseNumber,
      supplierId: supplier._id,
      supplierName: supplier.name,
      items: processedItems,
      totalAmount,
      amountPaid: paid,
      paymentStatus,
      status: isReceived ? PURCHASE_STATUS.RECEIVED : PURCHASE_STATUS.ORDERED,
      receivedAt: isReceived ? new Date() : undefined,
      notes: (notes || '').trim(),
      createdBy: req.user._id,
    });

    // If marked as received immediately, increase inventory stock & log movements!
    if (isReceived) {
      for (const item of processedItems) {
        await modifyVariantStock({
          variantId: item.variantId,
          quantityChange: item.quantity,
          type: STOCK_MOVEMENT_TYPE.PURCHASE,
          reason: `Goods received from Purchase Order ${purchase.purchaseNumber}`,
          referenceId: purchase._id,
          referenceType: 'Purchase',
          user: req.user,
        });

        // Optionally update variant's latest cost price
        await ProductVariant.findByIdAndUpdate(item.variantId, {
          $set: { costPrice: item.unitCost },
        });
      }
    }

    res.status(201).json({
      success: true,
      message: isReceived
        ? 'Purchase recorded and stock inventory increased'
        : 'Purchase order placed successfully (stock will update upon receipt)',
      purchase,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark a purchase order as received (increases inventory stock)
 */
async function markPurchaseReceived(req, res, next) {
  try {
    const { id } = req.params;
    const purchase = await Purchase.findById(id);

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    if (purchase.status === PURCHASE_STATUS.RECEIVED) {
      return res.status(400).json({
        success: false,
        message: 'This purchase order has already been marked as received.',
      });
    }

    if (purchase.status === PURCHASE_STATUS.CANCELLED) {
      return res.status(400).json({
        success: false,
        message: 'Cannot receive a cancelled purchase order.',
      });
    }

    // Increase stock for each item
    for (const item of purchase.items) {
      await modifyVariantStock({
        variantId: item.variantId,
        quantityChange: item.quantity,
        type: STOCK_MOVEMENT_TYPE.PURCHASE,
        reason: `Goods received from Purchase Order ${purchase.purchaseNumber}`,
        referenceId: purchase._id,
        referenceType: 'Purchase',
        user: req.user,
      });

      // Update variant cost price to latest received cost
      await ProductVariant.findByIdAndUpdate(item.variantId, {
        $set: { costPrice: item.unitCost },
      });
    }

    purchase.status = PURCHASE_STATUS.RECEIVED;
    purchase.receivedAt = new Date();
    await purchase.save();

    res.json({
      success: true,
      message: `Purchase ${purchase.purchaseNumber} marked as received. Stock quantities successfully increased.`,
      purchase,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Record a payment against an existing purchase
 */
async function recordPurchasePayment(req, res, next) {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid payment amount greater than zero is required',
      });
    }

    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    const newAmountPaid = Math.round((purchase.amountPaid + paymentAmount) * 100) / 100;

    if (newAmountPaid > purchase.totalAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment exceeds total due. Remaining balance is Rs. ${purchase.totalAmount - purchase.amountPaid}`,
      });
    }

    purchase.amountPaid = newAmountPaid;
    if (purchase.amountPaid >= purchase.totalAmount) {
      purchase.paymentStatus = PAYMENT_STATUS.PAID;
    } else {
      purchase.paymentStatus = PAYMENT_STATUS.PARTIAL;
    }

    await purchase.save();

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      purchase,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List all purchases with filters
 */
async function getPurchases(req, res, next) {
  try {
    const {
      supplierId,
      status,
      paymentStatus,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    if (supplierId) filter.supplierId = supplierId;
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

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

    const [purchases, totalCount] = await Promise.all([
      Purchase.find(filter)
        .populate('supplierId', 'name phone companyName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      Purchase.countDocuments(filter),
    ]);

    res.json({
      success: true,
      totalCount,
      page: parseInt(page, 10),
      totalPages: Math.ceil(totalCount / take),
      purchases,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get purchase by ID
 */
async function getPurchaseById(req, res, next) {
  try {
    const { id } = req.params;
    const purchase = await Purchase.findById(id)
      .populate('supplierId', 'name phone companyName email address')
      .populate('createdBy', 'fullName username')
      .lean();

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    res.json({
      success: true,
      purchase,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPurchase,
  markPurchaseReceived,
  recordPurchasePayment,
  getPurchases,
  getPurchaseById,
};

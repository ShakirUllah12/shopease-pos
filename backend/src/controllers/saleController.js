const Sale = require('../models/Sale');
const SalePayment = require('../models/SalePayment');
const ProductVariant = require('../models/ProductVariant');
const Product = require('../models/Product');
const Setting = require('../models/Setting');
const Customer = require('../models/Customer');
const CustomerLedger = require('../models/CustomerLedger');
const { generateReceiptNumber } = require('../services/receiptService');
const { modifyVariantStock } = require('../services/stockService');
const { runWithTransaction } = require('../services/transactionService');
const { SALE_STATUS, PAYMENT_STATUS, STOCK_MOVEMENT_TYPE } = require('../config/constants');

/**
 * Complete a POS Sale transaction with backend pricing calculation, stock validation,
 * snapshot preservation, and split-payment handling.
 */
async function createSale(req, res, next) {
  try {
    const {
      items,
      orderDiscount = 0,
      taxAmount = 0,
      customerId,
      customerName = 'Walk-in Customer',
      customerPhone = '',
      payments = [],
      cashTendered,
      notes = '',
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart cannot be empty. Please add at least one item.',
      });
    }

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one payment entry is required to complete the sale.',
      });
    }

    // Read store settings for negative stock configuration
    const setting = await Setting.findOne();
    const allowNegative = setting ? setting.allowNegativeStock : false;

    // Use atomic transaction wrapper
    const completedSale = await runWithTransaction(async (session) => {
      // 1. Process items, validate stock, and create snapshots
      let subtotal = 0;
      const snapshotItems = [];

      for (const item of items) {
        if (!item.variantId || !item.quantity || Number(item.quantity) <= 0) {
          throw new Error('Each item must specify a valid variant ID and positive quantity.');
        }

        const vQuery = ProductVariant.findById(item.variantId);
        if (session) vQuery.session(session);
        const variant = await vQuery;

        if (!variant || !variant.isActive) {
          throw new Error(`Product variant ${item.variantId} is invalid or inactive.`);
        }

        const pQuery = Product.findById(variant.productId);
        if (session) pQuery.session(session);
        const product = await pQuery;

        if (!product || !product.isActive) {
          throw new Error(`Product "${product ? product.name : variant.sku}" is currently deactivated.`);
        }

        const qty = parseInt(item.quantity, 10);

        // Pre-validate stock
        if (product.trackStock && !allowNegative && variant.currentStock < qty) {
          throw new Error(
            `Insufficient stock for "${product.name} (${variant.variantName || variant.sku})". In stock: ${variant.currentStock}, Requested: ${qty}`
          );
        }

        const unitPrice = variant.sellingPrice;
        const costPrice = variant.costPrice;
        const itemDiscount = Math.max(0, Number(item.discount) || 0);
        const lineTotal = Math.max(0, Math.round((unitPrice * qty - itemDiscount) * 100) / 100);

        subtotal += lineTotal;

        snapshotItems.push({
          productId: product._id,
          variantId: variant._id,
          productName: product.name,
          categoryName: product.categoryName || '',
          sku: variant.sku,
          size: variant.size || '',
          color: variant.color || '',
          costPrice,
          unitPrice,
          quantity: qty,
          discount: itemDiscount,
          lineTotal,
        });
      }

      subtotal = Math.round(subtotal * 100) / 100;
      const parsedOrderDiscount = Math.max(0, Math.min(subtotal, Number(orderDiscount) || 0));
      const parsedTax = Math.max(0, Number(taxAmount) || 0);
      const totalAmount = Math.round((subtotal - parsedOrderDiscount + parsedTax) * 100) / 100;

      // 2. Validate Payments
      let totalPaid = 0;
      for (const pay of payments) {
        const amt = Number(pay.amount);
        if (isNaN(amt) || amt <= 0) {
          throw new Error('Each payment must have an amount greater than zero.');
        }
        totalPaid += amt;
      }
      totalPaid = Math.round(totalPaid * 100) / 100;

      // Check change given (e.g. customer handed Rs. 5000 note for Rs. 4300 total)
      let changeGiven = 0;
      if (totalPaid > totalAmount) {
        changeGiven = Math.round((totalPaid - totalAmount) * 100) / 100;
      } else if (totalPaid < totalAmount) {
        throw new Error(
          `Payment received (Rs. ${totalPaid}) is less than total amount due (Rs. ${totalAmount}).`
        );
      }

      // Generate receipt number
      const receiptNumber = await generateReceiptNumber(session);

      // 3. Create Sale record
      const saleData = {
        receiptNumber,
        cashierId: req.user._id,
        cashierName: req.user.fullName || req.user.username,
        customerId: customerId || undefined,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: (customerPhone || '').trim(),
        items: snapshotItems,
        subtotal,
        orderDiscount: parsedOrderDiscount,
        taxAmount: parsedTax,
        totalAmount,
        amountPaid: totalPaid - changeGiven, // Net collected for the order
        changeGiven,
        paymentStatus: PAYMENT_STATUS.PAID,
        status: SALE_STATUS.COMPLETED,
        notes: (notes || '').trim(),
      };

      let saleDoc;
      if (session) {
        const created = await Sale.create([saleData], { session });
        saleDoc = created[0];
      } else {
        saleDoc = await Sale.create(saleData);
      }

      // 4. Save Payment records
      for (const pay of payments) {
        // If cash change was returned, adjust recorded cash amount to reflect net payment
        let recordedAmt = Number(pay.amount);
        if (pay.method === 'cash' && changeGiven > 0) {
          recordedAmt = Math.round((recordedAmt - changeGiven) * 100) / 100;
        }

        const paymentData = {
          saleId: saleDoc._id,
          method: pay.method,
          amount: recordedAmt,
          referenceNumber: (pay.referenceNumber || '').trim(),
          note: (pay.note || '').trim(),
          receivedAt: new Date(),
        };

        if (session) {
          await SalePayment.create([paymentData], { session });
        } else {
          await SalePayment.create(paymentData);
        }
      }

      // 4b. Customer Account & Khata (Udhaar) Credit Handling
      if (customerId) {
        const custQuery = Customer.findById(customerId);
        if (session) custQuery.session(session);
        const customer = await custQuery;
        if (customer) {
          customer.totalPurchases = (customer.totalPurchases || 0) + totalAmount;
          const creditPayment = payments.find((p) => p.method === 'credit');
          if (creditPayment && Number(creditPayment.amount) > 0) {
            const creditAmt = Number(creditPayment.amount);
            const prevBal = customer.currentBalance;
            customer.currentBalance = Math.round((prevBal + creditAmt) * 100) / 100;
            await customer.save({ session });

            const ledgerData = {
              customerId: customer._id,
              type: 'SALE_CREDIT',
              amount: creditAmt,
              previousBalance: prevBal,
              newBalance: customer.currentBalance,
              saleId: saleDoc._id,
              receiptNumber: saleDoc.receiptNumber,
              paymentMethod: 'credit',
              description: `Store Credit (Khata) on Receipt #${saleDoc.receiptNumber}`,
              recordedBy: req.user._id,
              recordedByName: req.user.fullName || req.user.username,
            };
            if (session) {
              await CustomerLedger.create([ledgerData], { session });
            } else {
              await CustomerLedger.create(ledgerData);
            }
          } else {
            await customer.save({ session });
          }
        }
      }

      // 5. Safely deduct inventory stock and write StockMovement audit entries
      for (const item of snapshotItems) {
        await modifyVariantStock({
          variantId: item.variantId,
          quantityChange: -item.quantity, // deduction
          type: STOCK_MOVEMENT_TYPE.SALE,
          reason: `Sold on Receipt #${receiptNumber}`,
          referenceId: saleDoc._id,
          referenceType: 'Sale',
          user: req.user,
          session,
        });
      }

      // Populate payments and return
      const populatedSale = await Sale.findById(saleDoc._id)
        .populate('payments')
        .populate('cashierId', 'fullName username')
        .session(session)
        .lean();

      return populatedSale;
    });

    res.status(201).json({
      success: true,
      message: 'Sale completed successfully',
      sale: completedSale,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List sales records with filters
 */
async function getSales(req, res, next) {
  try {
    const {
      search,
      cashierId,
      status,
      paymentStatus,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    // Cashiers only see their own sales unless owner
    if (req.user.role === 'cashier') {
      filter.cashierId = req.user._id;
    } else if (cashierId) {
      filter.cashierId = cashierId;
    }

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { receiptNumber: new RegExp(term, 'i') },
        { customerName: new RegExp(term, 'i') },
        { customerPhone: new RegExp(term, 'i') },
      ];
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

    const [sales, totalCount] = await Promise.all([
      Sale.find(filter)
        .populate('payments')
        .populate('cashierId', 'fullName username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      Sale.countDocuments(filter),
    ]);

    res.json({
      success: true,
      totalCount,
      page: parseInt(page, 10),
      totalPages: Math.ceil(totalCount / take),
      sales,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single receipt by receiptNumber or ID (for printing / reprinting)
 */
async function getSaleByReceipt(req, res, next) {
  try {
    const { identifier } = req.params;

    const query = identifier.startsWith('SE-')
      ? { receiptNumber: identifier.toUpperCase() }
      : { _id: identifier };

    const sale = await Sale.findOne(query)
      .populate('payments')
      .populate('cashierId', 'fullName username')
      .lean();

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found',
      });
    }

    const setting = await Setting.findOne().lean();

    res.json({
      success: true,
      sale,
      storeSettings: setting,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Refund / Void a sale (Owner only)
 * Restores items back to stock and creates StockMovement audit entries.
 */
async function refundSale(req, res, next) {
  try {
    const { id } = req.params;
    const { reason = 'Customer Return / Sale Voided' } = req.body;

    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    if (sale.status === SALE_STATUS.REFUNDED) {
      return res.status(400).json({
        success: false,
        message: 'This sale has already been refunded.',
      });
    }

    await runWithTransaction(async (session) => {
      // Restore stock for each snapshot item
      for (const item of sale.items) {
        await modifyVariantStock({
          variantId: item.variantId,
          quantityChange: item.quantity, // restore positive
          type: STOCK_MOVEMENT_TYPE.RETURN,
          reason: `Returned from Sale #${sale.receiptNumber}: ${reason}`,
          referenceId: sale._id,
          referenceType: 'SaleReturn',
          user: req.user,
          session,
        });
      }

      // Reverse Khata credit balance if sale had credit payment
      if (sale.customerId) {
        const custQuery = Customer.findById(sale.customerId);
        if (session) custQuery.session(session);
        const customer = await custQuery;
        if (customer) {
          const payments = await SalePayment.find({ saleId: sale._id });
          const creditPayment = payments.find((p) => p.method === 'credit');
          if (creditPayment && Number(creditPayment.amount) > 0) {
            const creditAmt = Number(creditPayment.amount);
            const prevBal = customer.currentBalance;
            customer.currentBalance = Math.max(0, Math.round((prevBal - creditAmt) * 100) / 100);
            await customer.save({ session });

            const ledgerData = {
              customerId: customer._id,
              type: 'REFUND_REVERSAL',
              amount: creditAmt,
              previousBalance: prevBal,
              newBalance: customer.currentBalance,
              saleId: sale._id,
              receiptNumber: sale.receiptNumber,
              paymentMethod: 'credit',
              description: `Khata credit reversed due to refund on Receipt #${sale.receiptNumber}`,
              recordedBy: req.user._id,
              recordedByName: req.user.fullName || req.user.username,
            };
            if (session) {
              await CustomerLedger.create([ledgerData], { session });
            } else {
              await CustomerLedger.create(ledgerData);
            }
          }
        }
      }

      sale.status = SALE_STATUS.REFUNDED;
      sale.notes = `${sale.notes || ''} [Refunded on ${new Date().toISOString()}: ${reason}]`.trim();
      await sale.save({ session });
    });

    res.json({
      success: true,
      message: `Sale #${sale.receiptNumber} refunded successfully. Stock restored to inventory.`,
      sale,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createSale,
  getSales,
  getSaleByReceipt,
  refundSale,
};

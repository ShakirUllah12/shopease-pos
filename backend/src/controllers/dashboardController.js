const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const ProductVariant = require('../models/ProductVariant');
const { SALE_STATUS } = require('../config/constants');

/**
 * Real-time Dashboard KPI Overview
 */
async function getDashboardSummary(req, res, next) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Today's Completed Sales
    const todaySales = await Sale.find({
      createdAt: { $gte: todayStart, $lte: todayEnd },
      status: SALE_STATUS.COMPLETED,
    }).lean();

    let todaySalesRevenue = 0;
    let todayCOGS = 0;
    todaySales.forEach((sale) => {
      todaySalesRevenue += sale.totalAmount;
      const cogs = sale.items.reduce((s, it) => s + it.costPrice * it.quantity, 0);
      todayCOGS += cogs;
    });

    const todayGrossProfit = Math.round((todaySalesRevenue - todayCOGS) * 100) / 100;

    // 2. Today's Expenses
    const todayExpenses = await Expense.find({
      date: { $gte: todayStart, $lte: todayEnd },
    }).lean();

    const todayExpensesTotal = todayExpenses.reduce((s, e) => s + e.amount, 0);
    const todayNetProfit = Math.round((todayGrossProfit - todayExpensesTotal) * 100) / 100;

    // 3. Low stock count and sample alerts
    const lowStockVariants = await ProductVariant.find({
      isActive: true,
      $expr: { $lte: ['$currentStock', '$minStockAlert'] },
    })
      .populate('productId', 'name categoryName isClothing')
      .sort({ currentStock: 1 })
      .limit(8)
      .lean();

    const totalLowStockCount = await ProductVariant.countDocuments({
      isActive: true,
      $expr: { $lte: ['$currentStock', '$minStockAlert'] },
    });

    // 4. Recent Sales (last 6)
    const recentSales = await Sale.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('cashierId', 'fullName username')
      .lean();

    // 5. Recent Expenses (last 5)
    const recentExpenses = await Expense.find()
      .sort({ date: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      today: {
        totalRevenue: Math.round(todaySalesRevenue * 100) / 100,
        transactionCount: todaySales.length,
        cogs: Math.round(todayCOGS * 100) / 100,
        grossProfit: todayGrossProfit,
        expensesTotal: Math.round(todayExpensesTotal * 100) / 100,
        netProfit: todayNetProfit,
      },
      inventory: {
        lowStockCount: totalLowStockCount,
        lowStockAlerts: lowStockVariants,
      },
      recentActivity: {
        sales: recentSales,
        expenses: recentExpenses,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardSummary,
};

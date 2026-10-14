const Sale = require('../models/Sale');
const SalePayment = require('../models/SalePayment');
const Expense = require('../models/Expense');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { SALE_STATUS } = require('../config/constants');

/**
 * Helper to build date boundary filter
 */
function getDateFilter(startDate, endDate) {
  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }
  return filter;
}

/**
 * Comprehensive Financial & Profit/Loss Report
 */
async function getProfitLossReport(req, res, next) {
  try {
    const { startDate, endDate } = req.query;

    const saleDateFilter = getDateFilter(startDate, endDate);
    const expenseDateFilter = {};
    if (startDate || endDate) {
      expenseDateFilter.date = {};
      if (startDate) expenseDateFilter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        expenseDateFilter.date.$lte = end;
      }
    }

    // 1. Fetch Sales (completed sales)
    const completedSales = await Sale.find({
      ...saleDateFilter,
      status: SALE_STATUS.COMPLETED,
    }).populate('payments').lean();

    // 2. Fetch Refunded Sales in range
    const refundedSales = await Sale.find({
      ...saleDateFilter,
      status: SALE_STATUS.REFUNDED,
    }).lean();

    // Calculate Sales Metrics
    let grossRevenue = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalCOGS = 0;
    let totalTransactions = completedSales.length;

    completedSales.forEach((sale) => {
      grossRevenue += sale.totalAmount;
      totalDiscount += (sale.orderDiscount || 0) + (sale.items.reduce((s, it) => s + (it.discount || 0), 0));
      totalTax += sale.taxAmount || 0;

      // COGS for completed sale items
      const saleCOGS = sale.items.reduce((s, it) => s + (it.costPrice * it.quantity), 0);
      totalCOGS += saleCOGS;
    });

    const totalRefundedAmount = refundedSales.reduce((s, r) => s + r.totalAmount, 0);

    // Gross Profit
    const grossProfit = Math.round((grossRevenue - totalCOGS) * 100) / 100;
    const grossProfitMargin = grossRevenue > 0 ? Math.round((grossProfit / grossRevenue) * 10000) / 100 : 0;

    // 3. Operating Expenses
    const expenses = await Expense.find(expenseDateFilter).lean();
    const totalOperatingExpenses = expenses.reduce((s, exp) => s + exp.amount, 0);

    // Group expenses by category
    const expensesByCategory = {};
    expenses.forEach((e) => {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
    });

    // 4. Net Profit = Gross Profit - Operating Expenses
    const netProfit = Math.round((grossProfit - totalOperatingExpenses) * 100) / 100;
    const netProfitMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 10000) / 100 : 0;

    // 5. Payment Methods Breakdown (actual cash received vs digital channels)
    const paymentBreakdown = {
      cash: 0,
      card: 0,
      bank_transfer: 0,
      jazzcash: 0,
      easypaisa: 0,
      other: 0,
    };

    const completedSaleIds = completedSales.map((s) => s._id);
    const allPayments = await SalePayment.find({ saleId: { $in: completedSaleIds } }).lean();

    allPayments.forEach((p) => {
      if (paymentBreakdown[p.method] !== undefined) {
        paymentBreakdown[p.method] += p.amount;
      } else {
        paymentBreakdown.other += p.amount;
      }
    });

    // Round breakdown amounts
    Object.keys(paymentBreakdown).forEach((k) => {
      paymentBreakdown[k] = Math.round(paymentBreakdown[k] * 100) / 100;
    });

    res.json({
      success: true,
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Today',
      },
      summary: {
        totalTransactions,
        refundedTransactions: refundedSales.length,
        grossRevenue: Math.round(grossRevenue * 100) / 100,
        totalRefundedAmount: Math.round(totalRefundedAmount * 100) / 100,
        totalDiscountsGiven: Math.round(totalDiscount * 100) / 100,
        totalTaxCollected: Math.round(totalTax * 100) / 100,
        totalCOGS: Math.round(totalCOGS * 100) / 100,
        grossProfit,
        grossProfitMarginPercent: grossProfitMargin,
        totalOperatingExpenses: Math.round(totalOperatingExpenses * 100) / 100,
        netProfit,
        netProfitMarginPercent: netProfitMargin,
      },
      paymentBreakdown,
      expensesByCategory,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Sales Performance by Category and Products
 */
async function getCategoryAndProductReport(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = getDateFilter(startDate, endDate);

    const completedSales = await Sale.find({
      ...dateFilter,
      status: SALE_STATUS.COMPLETED,
    }).lean();

    const categoryMap = {};
    const productMap = {};

    completedSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const catName = item.categoryName || 'General Store';
        const prodName = item.productName;
        const revenue = item.lineTotal;
        const cogs = item.costPrice * item.quantity;
        const profit = revenue - cogs;
        const qty = item.quantity;

        // Group by category
        if (!categoryMap[catName]) {
          categoryMap[catName] = {
            categoryName: catName,
            unitsSold: 0,
            revenue: 0,
            cogs: 0,
            profit: 0,
          };
        }
        categoryMap[catName].unitsSold += qty;
        categoryMap[catName].revenue += revenue;
        categoryMap[catName].cogs += cogs;
        categoryMap[catName].profit += profit;

        // Group by product
        if (!productMap[prodName]) {
          productMap[prodName] = {
            productName: prodName,
            categoryName: catName,
            sku: item.sku,
            unitsSold: 0,
            revenue: 0,
            cogs: 0,
            profit: 0,
          };
        }
        productMap[prodName].unitsSold += qty;
        productMap[prodName].revenue += revenue;
        productMap[prodName].cogs += cogs;
        productMap[prodName].profit += profit;
      });
    });

    const categoryStats = Object.values(categoryMap).map((c) => ({
      ...c,
      revenue: Math.round(c.revenue * 100) / 100,
      cogs: Math.round(c.cogs * 100) / 100,
      profit: Math.round(c.profit * 100) / 100,
      marginPercent: c.revenue > 0 ? Math.round((c.profit / c.revenue) * 10000) / 100 : 0,
    }));

    const productStats = Object.values(productMap)
      .map((p) => ({
        ...p,
        revenue: Math.round(p.revenue * 100) / 100,
        cogs: Math.round(p.cogs * 100) / 100,
        profit: Math.round(p.profit * 100) / 100,
        marginPercent: p.revenue > 0 ? Math.round((p.profit / p.revenue) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    res.json({
      success: true,
      categories: categoryStats,
      products: productStats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Daily Sales Trend Report (e.g. for last 7, 14, or 30 days)
 */
async function getDailyTrendReport(req, res, next) {
  try {
    const days = parseInt(req.query.days, 10) || 14;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    sinceDate.setHours(0, 0, 0, 0);

    const sales = await Sale.find({
      createdAt: { $gte: sinceDate },
      status: SALE_STATUS.COMPLETED,
    }).lean();

    const expenses = await Expense.find({
      date: { $gte: sinceDate },
    }).lean();

    // Group by YYYY-MM-DD
    const trendMap = {};

    for (let i = 0; i <= days; i++) {
      const d = new Date(sinceDate);
      d.setDate(d.getDate() + i);
      const dateKey = d.toISOString().slice(0, 10);
      trendMap[dateKey] = {
        date: dateKey,
        salesCount: 0,
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
        expenses: 0,
        netProfit: 0,
      };
    }

    sales.forEach((s) => {
      const dateKey = new Date(s.createdAt).toISOString().slice(0, 10);
      if (trendMap[dateKey]) {
        trendMap[dateKey].salesCount += 1;
        trendMap[dateKey].revenue += s.totalAmount;
        const saleCogs = s.items.reduce((c, it) => c + it.costPrice * it.quantity, 0);
        trendMap[dateKey].cogs += saleCogs;
      }
    });

    expenses.forEach((e) => {
      const dateKey = new Date(e.date).toISOString().slice(0, 10);
      if (trendMap[dateKey]) {
        trendMap[dateKey].expenses += e.amount;
      }
    });

    const trends = Object.values(trendMap).map((item) => {
      const grossProfit = item.revenue - item.cogs;
      const netProfit = grossProfit - item.expenses;
      return {
        ...item,
        revenue: Math.round(item.revenue * 100) / 100,
        cogs: Math.round(item.cogs * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        expenses: Math.round(item.expenses * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
      };
    });

    res.json({
      success: true,
      trends,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfitLossReport,
  getCategoryAndProductReport,
  getDailyTrendReport,
};

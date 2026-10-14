const Expense = require('../models/Expense');
const { EXPENSE_CATEGORIES } = require('../config/constants');

/**
 * List expenses with category and date range filters
 */
async function getExpenses(req, res, next) {
  try {
    const {
      category,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [expenses, totalCount, aggregateTotal] = await Promise.all([
      Expense.find(filter)
        .populate('createdBy', 'fullName username')
        .sort({ date: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      Expense.countDocuments(filter),
      Expense.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalAmount = aggregateTotal.length > 0 ? aggregateTotal[0].total : 0;

    res.json({
      success: true,
      totalCount,
      totalAmount: Math.round(totalAmount * 100) / 100,
      page: parseInt(page, 10),
      totalPages: Math.ceil(totalCount / take),
      categories: EXPENSE_CATEGORIES,
      expenses,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new expense (Owner only)
 */
async function createExpense(req, res, next) {
  try {
    const { title, category, amount, date, notes } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Expense title is required' });
    }

    if (!category || !EXPENSE_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Valid expense category is required: [${EXPENSE_CATEGORIES.join(', ')}]`,
      });
    }

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount greater than 0 is required' });
    }

    const expense = await Expense.create({
      title: title.trim(),
      category,
      amount: Math.round(parsedAmount * 100) / 100,
      date: date ? new Date(date) : new Date(),
      notes: (notes || '').trim(),
      createdBy: req.user._id,
      createdByName: req.user.fullName || req.user.username,
    });

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      expense,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an expense (Owner only)
 */
async function updateExpense(req, res, next) {
  try {
    const { id } = req.params;
    const { title, category, amount, date, notes } = req.body;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    if (title) expense.title = title.trim();
    if (category && EXPENSE_CATEGORIES.includes(category)) expense.category = category;
    if (amount && Number(amount) > 0) expense.amount = Math.round(Number(amount) * 100) / 100;
    if (date) expense.date = new Date(date);
    if (notes !== undefined) expense.notes = notes.trim();

    await expense.save();

    res.json({
      success: true,
      message: 'Expense updated successfully',
      expense,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete an expense (Owner only)
 */
async function deleteExpense(req, res, next) {
  try {
    const { id } = req.params;
    const expense = await Expense.findByIdAndDelete(id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};

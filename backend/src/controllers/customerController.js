const Customer = require('../models/Customer');
const CustomerLedger = require('../models/CustomerLedger');

/**
 * List / Search customers
 */
async function getCustomers(req, res, next) {
  try {
    const { search, page = 1, limit = 50, hasBalance } = req.query;
    const query = { isActive: true };

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { name: new RegExp(term, 'i') },
        { phone: new RegExp(term, 'i') },
      ];
    }

    if (hasBalance === 'true') {
      query.currentBalance = { $gt: 0 };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [customers, totalCount] = await Promise.all([
      Customer.find(query)
        .sort({ currentBalance: -1, updatedAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      Customer.countDocuments(query),
    ]);

    // Aggregate total Khata receivables
    const totalReceivableResult = await Customer.aggregate([
      { $match: { isActive: true, currentBalance: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$currentBalance' } } },
    ]);
    const totalKhataReceivables = totalReceivableResult[0]?.total || 0;

    res.json({
      success: true,
      totalCount,
      totalKhataReceivables,
      customers,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get customer profile & transaction ledger
 */
async function getCustomerById(req, res, next) {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id).lean();

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const ledger = await CustomerLedger.find({ customerId: id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      customer,
      ledger,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create new customer
 */
async function createCustomer(req, res, next) {
  try {
    const { name, phone, address, creditLimit = 50000, openingBalance = 0, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Customer contact phone is required' });
    }

    const existing = await Customer.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A customer with phone ${phone} already exists (${existing.name}).`,
        customer: existing,
      });
    }

    const initialBal = Math.max(0, Number(openingBalance) || 0);

    const customer = await Customer.create({
      name: name.trim(),
      phone: phone.trim(),
      address: (address || '').trim(),
      creditLimit: Math.max(0, Number(creditLimit) || 50000),
      currentBalance: initialBal,
      notes: (notes || '').trim(),
      isActive: true,
    });

    if (initialBal > 0) {
      await CustomerLedger.create({
        customerId: customer._id,
        type: 'OPENING_BALANCE',
        amount: initialBal,
        previousBalance: 0,
        newBalance: initialBal,
        description: 'Opening Khata balance upon account creation',
        recordedBy: req.user?._id,
        recordedByName: req.user?.fullName || req.user?.username || 'Staff',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Customer account created successfully',
      customer,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update customer details
 */
async function updateCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const { name, phone, address, creditLimit, notes, isActive } = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (name) customer.name = name.trim();
    if (phone) customer.phone = phone.trim();
    if (address !== undefined) customer.address = address.trim();
    if (creditLimit !== undefined) customer.creditLimit = Math.max(0, Number(creditLimit) || 0);
    if (notes !== undefined) customer.notes = notes.trim();
    if (typeof isActive === 'boolean') customer.isActive = isActive;

    await customer.save();

    res.json({
      success: true,
      message: 'Customer details updated',
      customer,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Record payment received against Khata balance
 */
async function recordCustomerPayment(req, res, next) {
  try {
    const { id } = req.params;
    const { amount, paymentMethod = 'cash', referenceNumber = '', notes = '' } = req.body;

    const payAmt = Number(amount);
    if (!payAmt || payAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive payment amount is required' });
    }

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const prevBal = customer.currentBalance;
    const newBal = Math.round((prevBal - payAmt) * 100) / 100;
    customer.currentBalance = newBal;
    await customer.save();

    const ledgerEntry = await CustomerLedger.create({
      customerId: customer._id,
      type: 'PAYMENT_RECEIVED',
      amount: payAmt,
      previousBalance: prevBal,
      newBalance: newBal,
      paymentMethod,
      referenceNumber: referenceNumber.trim(),
      description: notes.trim() || `Khata payment received via ${paymentMethod.toUpperCase()}`,
      recordedBy: req.user?._id,
      recordedByName: req.user?.fullName || req.user?.username || 'Staff',
    });

    res.json({
      success: true,
      message: `Received Rs. ${payAmt.toLocaleString()} from ${customer.name}. New Khata Balance: Rs. ${newBal.toLocaleString()}`,
      customer,
      ledgerEntry,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  recordCustomerPayment,
};

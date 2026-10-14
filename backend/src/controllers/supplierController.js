const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');

/**
 * List all suppliers
 */
async function getSuppliers(req, res, next) {
  try {
    const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();

    // Attach total purchases and outstanding balance for each supplier
    const enriched = await Promise.all(
      suppliers.map(async (sup) => {
        const purchases = await Purchase.find({ supplierId: sup._id }).lean();
        const totalPurchases = purchases.length;
        const totalAmount = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
        const totalPaid = purchases.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
        const outstandingBalance = Math.round((totalAmount - totalPaid) * 100) / 100;

        return {
          ...sup,
          totalPurchases,
          totalPurchasesAmount: totalAmount,
          outstandingBalance,
        };
      })
    );

    res.json({
      success: true,
      suppliers: enriched,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a supplier (Owner only)
 */
async function createSupplier(req, res, next) {
  try {
    const { name, companyName, phone, email, address } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Supplier name is required' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Supplier phone number is required' });
    }

    const supplier = await Supplier.create({
      name: name.trim(),
      companyName: (companyName || '').trim(),
      phone: phone.trim(),
      email: (email || '').trim(),
      address: (address || '').trim(),
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      supplier,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update supplier (Owner only)
 */
async function updateSupplier(req, res, next) {
  try {
    const { id } = req.params;
    const { name, companyName, phone, email, address, isActive } = req.body;

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    if (name) supplier.name = name.trim();
    if (companyName !== undefined) supplier.companyName = companyName.trim();
    if (phone) supplier.phone = phone.trim();
    if (email !== undefined) supplier.email = email.trim();
    if (address !== undefined) supplier.address = address.trim();
    if (typeof isActive === 'boolean') supplier.isActive = isActive;

    await supplier.save();

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      supplier,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSuppliers,
  createSupplier,
  updateSupplier,
};

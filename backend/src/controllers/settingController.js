const Setting = require('../models/Setting');

/**
 * Get current store settings
 */
async function getSettings(req, res, next) {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({
        shopName: 'ShopEase POS',
        tagline: 'Clothing & General Store',
        address: 'Shop # 14, Commercial Plaza, Main Boulevard, Karachi',
        phone: '+92 300 1234567',
        receiptFooter: 'Thank you for shopping at ShopEase POS! Exchanges accepted within 7 days with receipt.',
        currency: 'PKR',
        currencySymbol: 'Rs.',
        timezone: 'Asia/Karachi',
        allowNegativeStock: false,
        taxRate: 0,
      });
    }

    res.json({
      success: true,
      settings: setting,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update store settings (Owner only)
 */
async function updateSettings(req, res, next) {
  try {
    const {
      shopName,
      tagline,
      address,
      phone,
      receiptFooter,
      currency,
      currencySymbol,
      timezone,
      allowNegativeStock,
      taxRate,
    } = req.body;

    let setting = await Setting.findOne();
    if (!setting) {
      setting = new Setting();
    }

    if (shopName) setting.shopName = shopName.trim();
    if (tagline !== undefined) setting.tagline = tagline.trim();
    if (address !== undefined) setting.address = address.trim();
    if (phone !== undefined) setting.phone = phone.trim();
    if (receiptFooter !== undefined) setting.receiptFooter = receiptFooter.trim();
    if (currency) setting.currency = currency.trim();
    if (currencySymbol) setting.currencySymbol = currencySymbol.trim();
    if (timezone) setting.timezone = timezone.trim();
    if (typeof allowNegativeStock === 'boolean') setting.allowNegativeStock = allowNegativeStock;
    if (taxRate !== undefined && !isNaN(Number(taxRate))) setting.taxRate = Math.max(0, Number(taxRate));

    await setting.save();

    res.json({
      success: true,
      message: 'Store settings updated successfully',
      settings: setting,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSettings,
  updateSettings,
};

const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      required: true,
      default: 'ShopEase POS',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Clothing & General Store',
      trim: true,
    },
    address: {
      type: String,
      default: 'Shop #12, Commercial Market, Main Road',
      trim: true,
    },
    phone: {
      type: String,
      default: '+92 300 1234567',
      trim: true,
    },
    receiptFooter: {
      type: String,
      default: 'Thank you for shopping with us! Items can be exchanged within 7 days with original receipt.',
      trim: true,
    },
    currency: {
      type: String,
      default: 'PKR',
    },
    currencySymbol: {
      type: String,
      default: 'Rs.',
    },
    timezone: {
      type: String,
      default: 'Asia/Karachi',
    },
    allowNegativeStock: {
      type: Boolean,
      default: false,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Digital Payment Merchant QR Credentials (Raast, JazzCash, EasyPaisa, Bank)
    raastId: {
      type: String,
      default: '+923001234567',
      trim: true,
    },
    raastTitle: {
      type: String,
      default: 'ShopEase General Store',
      trim: true,
    },
    jazzcashNumber: {
      type: String,
      default: '03001234567',
      trim: true,
    },
    jazzcashTitle: {
      type: String,
      default: 'ShopEase Retail Account',
      trim: true,
    },
    easypaisaNumber: {
      type: String,
      default: '03451234567',
      trim: true,
    },
    easypaisaTitle: {
      type: String,
      default: 'ShopEase Retail Account',
      trim: true,
    },
    bankName: {
      type: String,
      default: 'Meezan Bank Limited',
      trim: true,
    },
    bankIban: {
      type: String,
      default: 'PK99MEZN0001234567890123',
      trim: true,
    },
    bankAccountTitle: {
      type: String,
      default: 'ShopEase Commercial Operations',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.model('Setting', settingSchema);
module.exports = Setting;

const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Customer contact phone is required'],
      trim: true,
      index: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    creditLimit: {
      type: Number,
      default: 50000,
      min: [0, 'Credit limit cannot be negative'],
    },
    currentBalance: {
      type: Number,
      default: 0,
      // Positive balance represents amount customer owes to the shop (Udhaar / Khata)
    },
    totalPurchases: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

customerSchema.index({ name: 'text', phone: 'text' });

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;

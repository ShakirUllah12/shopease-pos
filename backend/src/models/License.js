const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema(
  {
    machineId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    trialStartDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    trialEndDate: {
      type: Date,
      required: true,
    },
    lastHeartbeat: {
      type: Date,
      required: true,
      default: Date.now,
    },
    isLicensed: {
      type: Boolean,
      default: false,
    },
    licenseKey: {
      type: String,
      default: null,
      trim: true,
    },
    licenseType: {
      type: String,
      enum: ['none', 'lifetime', '1yr', '30d'],
      default: 'none',
    },
    licenseExpiresAt: {
      type: Date,
      default: null,
    },
    clientName: {
      type: String,
      default: '',
      trim: true,
    },
    activatedAt: {
      type: Date,
      default: null,
    },
    tamperDetected: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const License = mongoose.model('License', licenseSchema);
module.exports = License;

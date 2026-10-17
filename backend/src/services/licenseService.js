const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const License = require('../models/License');
const mongoose = require('mongoose');

// Master secret for offline HMAC verification (can be overridden in .env)
const MASTER_SECRET = process.env.LICENSE_MASTER_SECRET || 'SHOPEASE_POS_OFFLINE_MASTER_SECRET_2026_@#!';

// 3 Days Evaluation Trial duration in milliseconds (3 days = 72 hours)
const TRIAL_DURATION_DAYS = 3;
const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

// Disk persistence paths (uses /tmp on Vercel serverless, or root on local)
const baseDir = process.env.VERCEL ? os.tmpdir() : path.join(__dirname, '../..');
const MACHINE_ID_PATH = path.join(baseDir, '.shopease_machine.id');
const LICENSE_FILE_PATH = path.join(baseDir, '.shopease_license.json');

/**
 * Generates or retrieves a permanent, stable unique Machine Hardware ID
 * Format: SHOP-XXXX-XXXX-XXXX
 */
function getMachineId() {
  try {
    if (fs.existsSync(MACHINE_ID_PATH)) {
      const savedId = fs.readFileSync(MACHINE_ID_PATH, 'utf8').trim();
      if (savedId && /^SHOP-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/.test(savedId)) {
        return savedId;
      }
    }
  } catch (err) {
    // Fallback to calculation
  }

  // Create deterministic hardware fingerprint using OS, hostname, CPU model, architecture
  const cpus = os.cpus();
  const cpuModel = cpus.length > 0 ? cpus[0].model : 'generic-cpu';
  const network = JSON.stringify(os.networkInterfaces());
  const fingerprint = `${os.hostname()}|${os.platform()}|${os.arch()}|${cpuModel}|${network}`;

  const hash = crypto.createHash('sha256').update(fingerprint).digest('hex').toUpperCase();
  const part1 = hash.substring(0, 4);
  const part2 = hash.substring(4, 8);
  const part3 = hash.substring(8, 12);
  const machineId = `SHOP-${part1}-${part2}-${part3}`;

  try {
    fs.writeFileSync(MACHINE_ID_PATH, machineId, 'utf8');
  } catch (writeErr) {
    console.error('Warning: could not write machine ID to file:', writeErr.message);
  }

  return machineId;
}

/**
 * Safely reads the persistent disk license state
 */
function readDiskLicense() {
  try {
    if (fs.existsSync(LICENSE_FILE_PATH)) {
      const data = fs.readFileSync(LICENSE_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading disk license:', err.message);
  }
  return null;
}

/**
 * Safely writes the license state to persistent disk file
 */
function writeDiskLicense(data) {
  try {
    fs.writeFileSync(LICENSE_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing disk license:', err.message);
  }
}

/**
 * Generates an offline license key for a given machine ID and license tier
 * @param {string} machineId - e.g. "SHOP-A1B2-C3D4-E5F6"
 * @param {string} tier - "lifetime" | "1yr" | "30d"
 * @returns {string} - Formatted Product Key, e.g. "SEPOS-LIFE-A4B7-C9D1-E3F5"
 */
function generateOfflineLicenseKey(machineId, tier = 'lifetime') {
  const normMachineId = (machineId || '').trim().toUpperCase();
  let normTier = (tier || 'lifetime').trim().toUpperCase();
  if (normTier === 'LIFETIME' || normTier === 'LIFE') normTier = 'LIFE';
  else if (normTier === '1YR' || normTier === 'YEAR') normTier = '1YR';
  else if (normTier === '30D' || normTier === 'MONTH') normTier = '30D';
  else normTier = 'LIFE';

  const payload = `SEPOS:${normMachineId}:${normTier}`;
  const hmac = crypto.createHmac('sha256', MASTER_SECRET).update(payload).digest('hex').toUpperCase();

  const c1 = hmac.substring(0, 4);
  const c2 = hmac.substring(4, 8);
  const c3 = hmac.substring(8, 12);

  return `SEPOS-${normTier}-${c1}-${c2}-${c3}`;
}

/**
 * Verifies if an offline license key is valid for a given machine ID
 */
function verifyOfflineLicenseKey(licenseKey, machineId) {
  if (!licenseKey || typeof licenseKey !== 'string') {
    return { valid: false, error: 'License key is required' };
  }

  const cleanKey = licenseKey.trim().toUpperCase();
  const match = cleanKey.match(/^SEPOS-(LIFE|1YR|30D)-([A-F0-9]{4})-([A-F0-9]{4})-([A-F0-9]{4})$/);

  if (!match) {
    return { valid: false, error: 'Invalid license key format. Format must be SEPOS-XXXX-XXXX-XXXX-XXXX' };
  }

  const [, tier] = match;
  const expectedKey = generateOfflineLicenseKey(machineId, tier);

  if (cleanKey !== expectedKey) {
    return { valid: false, error: 'Invalid license key. This key does not match this machine installation.' };
  }

  return {
    valid: true,
    tier: tier === 'LIFE' ? 'lifetime' : tier === '1YR' ? '1yr' : '30d',
  };
}

/**
 * Initialize or get current license and trial status
 */
async function getLicenseStatus() {
  const machineId = getMachineId();
  const diskData = readDiskLicense();
  let dbDoc = null;

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      dbDoc = await License.findOne({ machineId });
    } catch (err) {
      // Database query error
    }
  }

  const now = Date.now();

  // Permanent Perpetual Lifetime License by default (no trial lockout, no clock tampering block)
  let isLicensed = true;
  let licenseKey = diskData?.licenseKey || dbDoc?.licenseKey || generateOfflineLicenseKey(machineId, 'lifetime');
  let licenseType = diskData?.licenseType || dbDoc?.licenseType || 'lifetime';
  let licenseExpiresAt = null;
  let clientName = diskData?.clientName || dbDoc?.clientName || 'ShopEase POS Verified Terminal';
  let activatedAt = diskData?.activatedAt ? new Date(diskData.activatedAt) : new Date();
  let trialStartDate = diskData?.trialStartDate ? new Date(diskData.trialStartDate) : new Date();
  let trialEndDate = new Date(Date.now() + 36500 * 24 * 60 * 60 * 1000); // 100 Years
  let lastHeartbeat = now;
  let tamperDetected = false;

  // Status is always licensed and never expired
  let status = 'licensed';
  let isExpired = false;

  // Remaining time calculations
  let remainingMs = Math.max(0, trialEndDate.getTime() - now);
  if (isLicensed && licenseExpiresAt) {
    remainingMs = Math.max(0, new Date(licenseExpiresAt).getTime() - now);
  } else if (isLicensed && licenseType === 'lifetime') {
    remainingMs = Infinity;
  }

  const daysRemaining = remainingMs === Infinity ? 9999 : Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const hoursRemaining = remainingMs === Infinity ? 9999 : Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutesRemaining = remainingMs === Infinity ? 9999 : Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

  const stateToSave = {
    machineId,
    trialStartDate: trialStartDate.toISOString(),
    trialEndDate: trialEndDate.toISOString(),
    lastHeartbeat: new Date(lastHeartbeat).toISOString(),
    isLicensed,
    licenseKey,
    licenseType,
    licenseExpiresAt: licenseExpiresAt ? new Date(licenseExpiresAt).toISOString() : null,
    clientName,
    activatedAt: activatedAt ? new Date(activatedAt).toISOString() : null,
    tamperDetected,
  };

  // Sync state back to disk
  writeDiskLicense(stateToSave);

  // Sync state back to MongoDB if connected
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      await License.findOneAndUpdate(
        { machineId },
        {
          ...stateToSave,
          trialStartDate,
          trialEndDate,
          lastHeartbeat: new Date(lastHeartbeat),
          licenseExpiresAt,
          activatedAt,
        },
        { upsert: true, new: true }
      );
    } catch (dbErr) {
      // Non-fatal if DB error
    }
  }

  return {
    machineId,
    status,
    isLicensed,
    isExpired,
    licenseType,
    licenseKey: isLicensed ? licenseKey : null,
    clientName,
    trialStartDate: trialStartDate.toISOString(),
    trialEndDate: trialEndDate.toISOString(),
    daysRemaining,
    hoursRemaining,
    minutesRemaining,
    tamperDetected,
    licensedUntil: licenseExpiresAt ? licenseExpiresAt.toISOString() : (licenseType === 'lifetime' ? 'Lifetime Perpetual' : null),
  };
}

/**
 * Activates software offline using supplied license key
 */
async function activateLicense(licenseKey, clientName = '') {
  const machineId = getMachineId();
  const verification = verifyOfflineLicenseKey(licenseKey, machineId);

  if (!verification.valid) {
    const error = new Error(verification.error);
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  let licenseExpiresAt = null;

  if (verification.tier === '1yr') {
    licenseExpiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  } else if (verification.tier === '30d') {
    licenseExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  const cleanKey = licenseKey.trim().toUpperCase();

  const diskData = readDiskLicense() || {};
  const updatedData = {
    ...diskData,
    machineId,
    isLicensed: true,
    licenseKey: cleanKey,
    licenseType: verification.tier,
    licenseExpiresAt: licenseExpiresAt ? licenseExpiresAt.toISOString() : null,
    clientName: (clientName || diskData.clientName || '').trim(),
    activatedAt: now.toISOString(),
    tamperDetected: false,
    lastHeartbeat: now.toISOString(),
  };

  writeDiskLicense(updatedData);

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      await License.findOneAndUpdate(
        { machineId },
        {
          ...updatedData,
          licenseExpiresAt,
          activatedAt: now,
          lastHeartbeat: now,
        },
        { upsert: true, new: true }
      );
    } catch (dbErr) {
      // Non-fatal
    }
  }

  return await getLicenseStatus();
}

module.exports = {
  MASTER_SECRET,
  TRIAL_DURATION_DAYS,
  getMachineId,
  generateOfflineLicenseKey,
  verifyOfflineLicenseKey,
  getLicenseStatus,
  activateLicense,
};

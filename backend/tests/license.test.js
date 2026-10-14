const { test, before, after, describe } = require('node:test');
const assert = require('node:assert');
const { connectDB, disconnectDB } = require('../src/config/db');
const licenseService = require('../src/services/licenseService');
const licenseController = require('../src/controllers/licenseController');
const licenseGuard = require('../src/middleware/licenseGuard');

describe('ShopEase POS 3-Day Offline Trial & Licensing System Tests', () => {
  before(async () => {
    await connectDB();
  });

  after(async () => {
    await disconnectDB();
  });

  test('1. Generates and retrieves stable Hardware Machine ID', () => {
    const machineId1 = licenseService.getMachineId();
    const machineId2 = licenseService.getMachineId();

    assert.ok(machineId1, 'Machine ID should not be empty');
    assert.match(
      machineId1,
      /^SHOP-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/,
      'Machine ID should match SHOP-XXXX-XXXX-XXXX format'
    );
    assert.strictEqual(machineId1, machineId2, 'Machine ID must be consistent and stable');
  });

  test('2. Starts 3-Day Evaluation Trial with active status', async () => {
    const status = await licenseService.getLicenseStatus();

    assert.ok(status.machineId);
    assert.strictEqual(status.status, 'trial_active');
    assert.strictEqual(status.isLicensed, false);
    assert.strictEqual(status.isExpired, false);
    assert.ok(status.daysRemaining >= 2 && status.daysRemaining <= 3);

    const start = new Date(status.trialStartDate).getTime();
    const end = new Date(status.trialEndDate).getTime();
    const diffDays = Math.round((end - start) / (24 * 60 * 60 * 1000));
    assert.strictEqual(diffDays, 3, 'Trial duration must be exactly 3 days');
  });

  test('3. Generates valid offline product keys for different tiers', () => {
    const machineId = licenseService.getMachineId();

    const lifeKey = licenseService.generateOfflineLicenseKey(machineId, 'lifetime');
    assert.match(lifeKey, /^SEPOS-LIFE-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);

    const yearKey = licenseService.generateOfflineLicenseKey(machineId, '1yr');
    assert.match(yearKey, /^SEPOS-1YR-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);

    const monthKey = licenseService.generateOfflineLicenseKey(machineId, '30d');
    assert.match(monthKey, /^SEPOS-30D-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);
  });

  test('4. Rejects invalid or mismatched offline product keys', () => {
    const machineId = licenseService.getMachineId();

    // 1. Wrong machine ID
    const keyForOtherMachine = licenseService.generateOfflineLicenseKey('SHOP-AAAA-BBBB-CCCC', 'lifetime');
    const verifyOther = licenseService.verifyOfflineLicenseKey(keyForOtherMachine, machineId);
    assert.strictEqual(verifyOther.valid, false);

    // 2. Tampered key
    const verifyTampered = licenseService.verifyOfflineLicenseKey('SEPOS-LIFE-0000-0000-0000', machineId);
    assert.strictEqual(verifyTampered.valid, false);

    // 3. Gibberish key
    const verifyGibberish = licenseService.verifyOfflineLicenseKey('INVALID-KEY-1234', machineId);
    assert.strictEqual(verifyGibberish.valid, false);
  });

  test('5. Successfully activates software offline with valid key', async () => {
    const machineId = licenseService.getMachineId();
    const validKey = licenseService.generateOfflineLicenseKey(machineId, 'lifetime');

    const activatedStatus = await licenseService.activateLicense(validKey, 'Test Client Mart');

    assert.strictEqual(activatedStatus.isLicensed, true);
    assert.strictEqual(activatedStatus.status, 'licensed');
    assert.strictEqual(activatedStatus.isExpired, false);
    assert.strictEqual(activatedStatus.licenseType, 'lifetime');
    assert.strictEqual(activatedStatus.licenseKey, validKey);
    assert.strictEqual(activatedStatus.clientName, 'Test Client Mart');
  });

  test('6. License guard passes through for licensed state', async () => {
    let nextCalled = false;
    const req = { path: '/api/sales' };
    const res = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.data = data;
        return this;
      },
    };

    await licenseGuard(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true, 'License guard must allow request when licensed');
  });

  test('7. License Controller API returns status and activates via HTTP request', async () => {
    let statusResponse = null;
    const reqGet = {};
    const resGet = {
      json(data) {
        statusResponse = data;
        return this;
      },
    };

    await licenseController.getStatus(reqGet, resGet, () => {});
    assert.strictEqual(statusResponse.success, true);
    assert.strictEqual(statusResponse.license.isLicensed, true);

    // Test machine ID endpoint
    let machineIdResponse = null;
    const resMid = {
      json(data) {
        machineIdResponse = data;
        return this;
      },
    };
    await licenseController.getMachineId(reqGet, resMid, () => {});
    assert.strictEqual(machineIdResponse.success, true);
    assert.ok(machineIdResponse.machineId.startsWith('SHOP-'));
  });
});

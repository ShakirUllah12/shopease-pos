const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const ProductVariant = require('../src/models/ProductVariant');
const Customer = require('../src/models/Customer');
const CustomerLedger = require('../src/models/CustomerLedger');
const Shift = require('../src/models/Shift');

const customerController = require('../src/controllers/customerController');
const saleController = require('../src/controllers/saleController');
const shiftController = require('../src/controllers/shiftController');

function mockReqRes(reqData = {}) {
  const req = {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...reqData,
  };

  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    get statusCode() {
      return statusCode;
    },
    get data() {
      return responseData;
    },
  };

  const next = (err) => {
    if (err) throw err;
  };

  return { req, res, next };
}

describe('Customer Khata Ledger & Shift Drawer Z-Report Tests', () => {
  let testUser;
  let testVariant;
  let testCustomer;
  let testShiftId;

  before(async () => {
    process.env.AUTO_FALLBACK_IN_MEMORY_DB = 'true';
    await connectDB();
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await ProductVariant.deleteMany({});
    await Customer.deleteMany({});
    await CustomerLedger.deleteMany({});
    await Shift.deleteMany({});

    testUser = await User.create({
      username: 'ownertester',
      name: 'Owner Tester',
      email: 'ownertester@shopease.pos',
      passwordHash: 'hashedpwd123',
      role: 'owner',
      isActive: true,
    });

    const category = await Category.create({
      name: 'Groceries',
      slug: 'groceries',
      isActive: true,
    });

    const product = await Product.create({
      name: 'Basmati Rice 5kg',
      categoryId: category._id,
      trackStock: true,
      isActive: true,
    });

    testVariant = await ProductVariant.create({
      productId: product._id,
      sku: 'RICE-5KG',
      sellingPrice: 1500,
      costPrice: 1200,
      stockQuantity: 50,
      isActive: true,
    });
  });

  after(async () => {
    await disconnectDB();
  });

  test('1. Create Customer with credit limit and initial zero balance', async () => {
    const { req, res, next } = mockReqRes({
      user: testUser,
      body: {
        name: 'Tariq Mehmood',
        phone: '03001234567',
        address: 'House 12, Gulshan, Karachi',
        creditLimit: 25000,
        notes: 'VIP customer',
      },
    });

    await customerController.createCustomer(req, res, next);
    assert.equal(res.statusCode, 201);
    assert.equal(res.data.success, true);
    assert.equal(res.data.customer.name, 'Tariq Mehmood');
    assert.equal(res.data.customer.currentBalance, 0);
    testCustomer = res.data.customer;
  });

  test('2. Start Cash Shift with opening drawer float', async () => {
    const { req, res, next } = mockReqRes({
      user: testUser,
      body: {
        openingCash: 5000,
        openingNotes: 'Morning float with 5000 PKR small notes',
      },
    });

    await shiftController.startShift(req, res, next);
    assert.equal(res.statusCode, 201);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.openingCash, 5000);
    assert.equal(res.data.data.status, 'OPEN');
    testShiftId = res.data.data._id;
  });

  test('3. Sale on Khata / Credit updates customer balance and creates ledger record', async () => {
    const { req, res, next } = mockReqRes({
      user: testUser,
      body: {
        customerId: testCustomer._id,
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        items: [
          {
            variantId: testVariant._id,
            quantity: 2,
            discount: 0,
          },
        ],
        payments: [
          { method: 'credit', amount: 3000 },
        ],
        notes: 'Udhaar sale for Tariq Mehmood',
      },
    });

    await saleController.createSale(req, res, next);
    assert.equal(res.statusCode, 201);
    assert.equal(res.data.success, true);

    const updatedCustomer = await Customer.findById(testCustomer._id);
    assert.equal(updatedCustomer.currentBalance, 3000);

    const ledger = await CustomerLedger.findOne({ customerId: testCustomer._id });
    assert.ok(ledger);
    assert.equal(ledger.type, 'SALE_CREDIT');
    assert.equal(ledger.amount, 3000);
    assert.equal(ledger.newBalance, 3000);
  });

  test('4. Record Customer Repayment reduces balance and logs ledger entry', async () => {
    const { req, res, next } = mockReqRes({
      user: testUser,
      params: { id: testCustomer._id },
      body: {
        amount: 2000,
        paymentMethod: 'cash',
        referenceNumber: 'CASH-REC-001',
        description: 'Partial cash payment',
      },
    });

    await customerController.recordCustomerPayment(req, res, next);
    assert.equal(res.statusCode, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.customer.currentBalance, 1000);

    const latestLedger = await CustomerLedger.findOne({
      customerId: testCustomer._id,
      type: 'PAYMENT_RECEIVED',
    });
    assert.ok(latestLedger);
    assert.equal(latestLedger.amount, 2000);
    assert.equal(latestLedger.newBalance, 1000);
  });

  test('5. Record Cash In, Cash Out, and Close Shift with Day-End Z-Report', async () => {
    // Record Cash In
    const inRes = mockReqRes({
      user: testUser,
      params: { id: testShiftId },
      body: {
        type: 'CASH_IN',
        amount: 500,
        reason: 'Added coins from safe',
      },
    });
    await shiftController.recordCashMovement(inRes.req, inRes.res, inRes.next);
    assert.equal(inRes.res.statusCode, 200);

    // Record Cash Out
    const outRes = mockReqRes({
      user: testUser,
      params: { id: testShiftId },
      body: {
        type: 'CASH_OUT',
        amount: 200,
        reason: 'Staff lunch',
      },
    });
    await shiftController.recordCashMovement(outRes.req, outRes.res, outRes.next);
    assert.equal(outRes.res.statusCode, 200);

    // Close Shift:
    // Expected = 5000 (opening) + 2000 (repayment in cash) + 500 (cash in) - 200 (cash out) = 7300 PKR
    const closeRes = mockReqRes({
      user: testUser,
      params: { id: testShiftId },
      body: {
        actualCash: 7300,
        closingNotes: 'Balanced perfectly',
      },
    });
    await shiftController.closeShift(closeRes.req, closeRes.res, closeRes.next);
    assert.equal(closeRes.res.statusCode, 200);
    assert.equal(closeRes.res.data.success, true);
    assert.equal(closeRes.res.data.data.status, 'CLOSED');
    assert.equal(closeRes.res.data.data.expectedCash, 7300);
    assert.equal(closeRes.res.data.data.actualCash, 7300);
    assert.equal(closeRes.res.data.data.cashDifference, 0);
  });
});

const { test, before, after, describe } = require('node:test');
const assert = require('node:assert');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const ProductVariant = require('../src/models/ProductVariant');
const Supplier = require('../src/models/Supplier');
const Purchase = require('../src/models/Purchase');
const Sale = require('../src/models/Sale');
const SalePayment = require('../src/models/SalePayment');
const Expense = require('../src/models/Expense');
const StockMovement = require('../src/models/StockMovement');
const Setting = require('../src/models/Setting');
const { ROLES, CATEGORIES, STOCK_MOVEMENT_TYPE } = require('../src/config/constants');

// Controllers & Services
const authController = require('../src/controllers/authController');
const categoryController = require('../src/controllers/categoryController');
const productController = require('../src/controllers/productController');
const purchaseController = require('../src/controllers/purchaseController');
const saleController = require('../src/controllers/saleController');
const stockController = require('../src/controllers/stockController');
const reportController = require('../src/controllers/reportController');
const { authenticate, authorize } = require('../src/middleware/auth');

// Test fixtures
let ownerUser;
let cashierUser;
let clothingCategory;
let generalCategory;
let testSupplier;
let createdShirtProduct;
let createdSnackProduct;

// Express mock helper
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

describe('ShopEase POS Core Integration Test Suite', () => {
  before(async () => {
    process.env.AUTO_FALLBACK_IN_MEMORY_DB = 'true';
    await connectDB();

    // Clean test collections
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await ProductVariant.deleteMany({});
    await Supplier.deleteMany({});
    await Purchase.deleteMany({});
    await Sale.deleteMany({});
    await SalePayment.deleteMany({});
    await Expense.deleteMany({});
    await StockMovement.deleteMany({});
    await Setting.deleteMany({});

    // Seed default settings
    await Setting.create({
      shopName: 'ShopEase Test POS',
      allowNegativeStock: false,
    });
  });

  after(async () => {
    await disconnectDB();
  });

  test('1. Setup initial owner, authentication, profile and permissions', async () => {
    // Initial Owner Setup
    const { req: setupReq, res: setupRes, next: setupNext } = mockReqRes({
      body: {
        username: 'testowner',
        fullName: 'Test Owner Admin',
        email: 'owner@shopease.pk',
        password: 'Password123!',
      },
    });

    await authController.setupInitialOwner(setupReq, setupRes, setupNext);
    assert.strictEqual(setupRes.statusCode, 201);
    assert.strictEqual(setupRes.data.success, true);
    assert.strictEqual(setupRes.data.user.role, ROLES.OWNER);
    ownerUser = setupRes.data.user;

    // Prevent duplicate initial owner setup (wizard lockout)
    const { req: dupSetupReq, res: dupSetupRes, next: dupSetupNext } = mockReqRes({
      body: {
        username: 'hacker',
        fullName: 'Unauthorized Admin',
        password: 'Password123!',
      },
    });
    await authController.setupInitialOwner(dupSetupReq, dupSetupRes, dupSetupNext);
    assert.strictEqual(dupSetupRes.statusCode, 403);

    // Invalid login password rejected
    const { req: badLoginReq, res: badLoginRes, next: badLoginNext } = mockReqRes({
      body: {
        username: 'testowner',
        password: 'WrongPassword!',
      },
    });
    await authController.login(badLoginReq, badLoginRes, badLoginNext);
    assert.strictEqual(badLoginRes.statusCode, 401);

    // Login Owner
    const { req: loginReq, res: loginRes, next: loginNext } = mockReqRes({
      body: {
        username: 'testowner',
        password: 'Password123!',
      },
    });
    await authController.login(loginReq, loginRes, loginNext);
    assert.strictEqual(loginRes.statusCode, 200);
    assert.ok(loginRes.data.token);

    // GET /api/auth/me profile verification
    const { req: meReq, res: meRes } = mockReqRes({ user: ownerUser });
    await authController.getProfile(meReq, meRes);
    assert.strictEqual(meRes.statusCode, 200);
    assert.strictEqual(meRes.data.user.username, 'testowner');

    // Create Cashier user
    const { req: cashReq, res: cashRes, next: cashNext } = mockReqRes({
      user: ownerUser,
      body: {
        username: 'testcashier',
        fullName: 'Shop Cashier 1',
        email: 'cashier@shopease.pk',
        password: 'CashierPassword123!',
        role: ROLES.CASHIER,
      },
    });
    await authController.createUser(cashReq, cashRes, cashNext);
    assert.strictEqual(cashRes.statusCode, 201);
    cashierUser = cashRes.data.user;
    assert.strictEqual(cashierUser.role, ROLES.CASHIER);

    // Role-based Access Control Check: Cashier blocked from Owner-only actions
    const ownerGuard = authorize(ROLES.OWNER);
    const { req: guardReq, res: guardRes } = mockReqRes({ user: cashierUser });
    let guardPassed = false;
    ownerGuard(guardReq, guardRes, () => { guardPassed = true; });
    assert.strictEqual(guardPassed, false);
    assert.strictEqual(guardRes.statusCode, 403);

    // Deactivated user cannot login
    const tempDeactivatedUser = await User.create({
      username: 'deactivatedcashier',
      fullName: 'Deactivated Cashier',
      passwordHash: await User.hashPassword('Pass123!'),
      role: ROLES.CASHIER,
      isActive: false,
    });
    const { req: deactReq, res: deactRes, next: deactNext } = mockReqRes({
      body: {
        username: 'deactivatedcashier',
        password: 'Pass123!',
      },
    });
    await authController.login(deactReq, deactRes, deactNext);
    assert.strictEqual(deactRes.statusCode, 403);
    await User.findByIdAndDelete(tempDeactivatedUser._id);
  });

  test('2. Seed Categories and Product with Variants', async () => {
    clothingCategory = await Category.create({
      name: CATEGORIES.CLOTHING,
      isSystemDefault: true,
    });
    generalCategory = await Category.create({
      name: CATEGORIES.GENERAL_STORE,
      isSystemDefault: true,
    });

    assert.ok(clothingCategory._id);
    assert.ok(generalCategory._id);
    assert.strictEqual(clothingCategory.slug, 'clothing');
    assert.strictEqual(generalCategory.slug, 'general-store');

    // Create Clothing Product with S/M size and Black/Blue color variants
    const { req: clothReq, res: clothRes, next: clothNext } = mockReqRes({
      user: ownerUser,
      body: {
        name: 'Cotton Oxford Shirt',
        categoryId: clothingCategory._id,
        isClothing: true,
        variants: [
          {
            sku: 'SHIRT-BLU-M',
            variantName: 'Blue / M',
            color: 'Blue',
            size: 'M',
            costPrice: 1200,
            sellingPrice: 2200,
            initialStock: 15,
            minStockAlert: 3,
          },
          {
            sku: 'SHIRT-BLK-L',
            variantName: 'Black / L',
            color: 'Black',
            size: 'L',
            costPrice: 1200,
            sellingPrice: 2200,
            initialStock: 10,
            minStockAlert: 2,
          },
        ],
      },
    });

    await productController.createProduct(clothReq, clothRes, clothNext);
    assert.strictEqual(clothRes.statusCode, 201);
    createdShirtProduct = clothRes.data.product;
    assert.strictEqual(createdShirtProduct.variants.length, 2);

    // Verify initial stock movements were logged
    const shirtMovements = await StockMovement.find({ productId: createdShirtProduct._id });
    assert.strictEqual(shirtMovements.length, 2);
    assert.strictEqual(shirtMovements[0].type, STOCK_MOVEMENT_TYPE.OPENING_STOCK);

    // Create General Store Product (Single Default Variant)
    const { req: genReq, res: genRes, next: genNext } = mockReqRes({
      user: ownerUser,
      body: {
        name: 'Premium Tea Biscuits 200g',
        categoryId: generalCategory._id,
        isClothing: false,
        variants: [
          {
            sku: 'GEN-BISC-01',
            variantName: 'Default',
            costPrice: 70,
            sellingPrice: 100,
            initialStock: 50,
            minStockAlert: 10,
          },
        ],
      },
    });

    await productController.createProduct(genReq, genRes, genNext);
    assert.strictEqual(genRes.statusCode, 201);
    createdSnackProduct = genRes.data.product;

    // Verify Duplicate SKU Prevention
    const { req: dupReq, res: dupRes, next: dupNext } = mockReqRes({
      user: ownerUser,
      body: {
        name: 'Duplicate SKU Product',
        categoryId: generalCategory._id,
        variants: [
          {
            sku: 'SHIRT-BLU-M', // Duplicate!
            costPrice: 500,
            sellingPrice: 900,
          },
        ],
      },
    });

    await productController.createProduct(dupReq, dupRes, dupNext);
    assert.strictEqual(dupRes.statusCode, 409);
  });

  test('2b. Category Management: Create, Duplicate Check, PATCH update, and List', async () => {
    // 1. Create a new category
    const { req: createCatReq, res: createCatRes, next: createCatNext } = mockReqRes({
      user: ownerUser,
      body: {
        name: 'Accessories & Footwear',
        description: 'Belts, socks, and shoes',
      },
    });
    await categoryController.createCategory(createCatReq, createCatRes, createCatNext);
    assert.strictEqual(createCatRes.statusCode, 201);
    const newCategory = createCatRes.data.category;
    assert.strictEqual(newCategory.name, 'Accessories & Footwear');
    assert.strictEqual(newCategory.slug, 'accessories-footwear');

    // 2. Prevent duplicate category creation
    const { req: dupCatReq, res: dupCatRes, next: dupCatNext } = mockReqRes({
      user: ownerUser,
      body: {
        name: 'Accessories & Footwear',
      },
    });
    await categoryController.createCategory(dupCatReq, dupCatRes, dupCatNext);
    assert.strictEqual(dupCatRes.statusCode, 409);

    // 3. PATCH /api/categories/:id - Update name and description
    const { req: patchCatReq, res: patchCatRes, next: patchCatNext } = mockReqRes({
      user: ownerUser,
      params: { id: newCategory._id },
      body: {
        name: 'Accessories & Shoes',
        description: 'Updated accessories description',
        isActive: false,
      },
    });
    await categoryController.updateCategory(patchCatReq, patchCatRes, patchCatNext);
    assert.strictEqual(patchCatRes.statusCode, 200);
    assert.strictEqual(patchCatRes.data.category.name, 'Accessories & Shoes');
    assert.strictEqual(patchCatRes.data.category.isActive, false);

    // 4. Duplicate name validation during category rename
    const { req: dupRenameReq, res: dupRenameRes, next: dupRenameNext } = mockReqRes({
      user: ownerUser,
      params: { id: newCategory._id },
      body: {
        name: CATEGORIES.CLOTHING, // Already taken
      },
    });
    await categoryController.updateCategory(dupRenameReq, dupRenameRes, dupRenameNext);
    assert.strictEqual(dupRenameRes.statusCode, 409);

    // 5. GET /api/categories - Verify list and attached product counts
    const { req: listCatReq, res: listCatRes, next: listCatNext } = mockReqRes({
      user: cashierUser,
    });
    await categoryController.getCategories(listCatReq, listCatRes, listCatNext);
    assert.strictEqual(listCatRes.statusCode, 200);
    assert.ok(Array.isArray(listCatRes.data.categories));
    const clothingInList = listCatRes.data.categories.find(c => c.name === CATEGORIES.CLOTHING);
    assert.ok(clothingInList);
    assert.strictEqual(clothingInList.productCount, 1); // 1 shirt created earlier

    // Clean up test category
    await Category.findByIdAndDelete(newCategory._id);
  });

  test('2c. Product Listing, Search, Filter, Details, PATCH Update and Status Toggle', async () => {
    // 1. GET /api/products with search query
    const { req: searchReq, res: searchRes, next: searchNext } = mockReqRes({
      user: cashierUser,
      query: { search: 'Oxford' },
    });
    await productController.getProducts(searchReq, searchRes, searchNext);
    assert.strictEqual(searchRes.statusCode, 200);
    assert.strictEqual(searchRes.data.products.length, 1);
    assert.strictEqual(searchRes.data.products[0].name, 'Cotton Oxford Shirt');

    // 2. GET /api/products search by variant SKU
    const { req: skuSearchReq, res: skuSearchRes, next: skuSearchNext } = mockReqRes({
      user: cashierUser,
      query: { search: 'GEN-BISC-01' },
    });
    await productController.getProducts(skuSearchReq, skuSearchRes, skuSearchNext);
    assert.strictEqual(skuSearchRes.statusCode, 200);
    assert.strictEqual(skuSearchRes.data.products.length, 1);
    assert.strictEqual(skuSearchRes.data.products[0].name, 'Premium Tea Biscuits 200g');

    // 3. GET /api/products filter by category
    const { req: catFilterReq, res: catFilterRes, next: catFilterNext } = mockReqRes({
      user: cashierUser,
      query: { categoryId: generalCategory._id.toString() },
    });
    await productController.getProducts(catFilterReq, catFilterRes, catFilterNext);
    assert.strictEqual(catFilterRes.statusCode, 200);
    assert.strictEqual(catFilterRes.data.products.length, 1);
    assert.strictEqual(catFilterRes.data.products[0]._id.toString(), createdSnackProduct._id.toString());

    // 4. GET /api/products/:id - Product Details view
    const { req: detailReq, res: detailRes, next: detailNext } = mockReqRes({
      user: cashierUser,
      params: { id: createdShirtProduct._id },
    });
    await productController.getProductById(detailReq, detailRes, detailNext);
    assert.strictEqual(detailRes.statusCode, 200);
    assert.strictEqual(detailRes.data.product.name, 'Cotton Oxford Shirt');
    assert.strictEqual(detailRes.data.product.variants.length, 2);

    // 5. PATCH /api/products/:id - Update product
    const { req: updateReq, res: updateRes, next: updateNext } = mockReqRes({
      user: ownerUser,
      params: { id: createdShirtProduct._id },
      body: {
        name: 'Cotton Oxford Shirt (Premium)',
        description: '100% fine cotton yarn',
      },
    });
    await productController.updateProduct(updateReq, updateRes, updateNext);
    assert.strictEqual(updateRes.statusCode, 200);
    assert.strictEqual(updateRes.data.product.name, 'Cotton Oxford Shirt (Premium)');

    // 6. PATCH /api/products/:id/status - Toggle active/inactive status
    const { req: deactReq, res: deactRes, next: deactNext } = mockReqRes({
      user: ownerUser,
      params: { id: createdShirtProduct._id },
      body: { isActive: false },
    });
    await productController.toggleProductStatus(deactReq, deactRes, deactNext);
    assert.strictEqual(deactRes.statusCode, 200);
    assert.strictEqual(deactRes.data.isActive, false);

    // Verify variants also deactivated
    const deactVariants = await ProductVariant.find({ productId: createdShirtProduct._id });
    assert.ok(deactVariants.every(v => v.isActive === false));

    // Reactivate product
    const { req: reactReq, res: reactRes, next: reactNext } = mockReqRes({
      user: ownerUser,
      params: { id: createdShirtProduct._id },
      body: { isActive: true },
    });
    await productController.toggleProductStatus(reactReq, reactRes, reactNext);
    assert.strictEqual(reactRes.statusCode, 200);
    assert.strictEqual(reactRes.data.isActive, true);

    const reactVariants = await ProductVariant.find({ productId: createdShirtProduct._id });
    assert.ok(reactVariants.every(v => v.isActive === true));

    // Restore original product name for downstream sale snapshot assertion
    await Product.findByIdAndUpdate(createdShirtProduct._id, { name: 'Cotton Oxford Shirt' });
  });

  test('3. Supplier & Purchase Order Flow', async () => {
    testSupplier = await Supplier.create({
      name: 'Textile Wholesale Hub',
      phone: '03001112233',
    });

    const shirtVariantM = createdShirtProduct.variants[0];

    // Create Purchase in 'ordered' status
    const { req: poReq, res: poRes, next: poNext } = mockReqRes({
      user: ownerUser,
      body: {
        supplierId: testSupplier._id,
        status: 'ordered',
        items: [
          {
            variantId: shirtVariantM._id,
            quantity: 20,
            unitCost: 1150,
          },
        ],
        amountPaid: 10000,
      },
    });

    await purchaseController.createPurchase(poReq, poRes, poNext);
    assert.strictEqual(poRes.statusCode, 201);
    const purchase = poRes.data.purchase;
    assert.strictEqual(purchase.totalAmount, 23000); // 20 * 1150
    assert.strictEqual(purchase.paymentStatus, 'partial');

    // Stock should NOT increase yet while ordered
    const variantBefore = await ProductVariant.findById(shirtVariantM._id);
    assert.strictEqual(variantBefore.currentStock, 15);

    // Mark Purchase as Received
    const { req: recReq, res: recRes, next: recNext } = mockReqRes({
      user: ownerUser,
      params: { id: purchase._id },
    });

    await purchaseController.markPurchaseReceived(recReq, recRes, recNext);
    assert.strictEqual(recRes.statusCode, 200);

    // Stock MUST increase now to 15 + 20 = 35
    const variantAfter = await ProductVariant.findById(shirtVariantM._id);
    assert.strictEqual(variantAfter.currentStock, 35);

    // Check Purchase StockMovement logged
    const pMovement = await StockMovement.findOne({
      referenceId: purchase._id,
      type: STOCK_MOVEMENT_TYPE.PURCHASE,
    });
    assert.ok(pMovement);
    assert.strictEqual(pMovement.quantityChange, 20);
  });

  test('4. POS Sale Transaction with Split Payment and Stock Deduction', async () => {
    const shirtVariantM = createdShirtProduct.variants[0]; // stock is 35, sellingPrice 2200, costPrice 1150
    const biscuitVariant = createdSnackProduct.variants[0]; // stock is 50, sellingPrice 100, costPrice 70

    // Sell: 2 shirts (4400) + 5 biscuits (500) = Subtotal 4900
    // Order discount: Rs. 100 -> Total: Rs. 4800
    // Split payment: Cash Rs. 3000 + JazzCash Rs. 2000 (Tendered total: Rs. 5000 -> Change: Rs. 200)
    const { req: saleReq, res: saleRes, next: saleNext } = mockReqRes({
      user: cashierUser,
      body: {
        customerName: 'Muhammad Ali',
        customerPhone: '03129876543',
        items: [
          {
            variantId: shirtVariantM._id,
            quantity: 2,
            discount: 0,
          },
          {
            variantId: biscuitVariant._id,
            quantity: 5,
            discount: 0,
          },
        ],
        orderDiscount: 100,
        payments: [
          { method: 'cash', amount: 3000 },
          { method: 'jazzcash', amount: 2000, referenceNumber: 'JC-998822' },
        ],
      },
    });

    await saleController.createSale(saleReq, saleRes, saleNext);
    assert.strictEqual(saleRes.statusCode, 201);
    const sale = saleRes.data.sale;

    assert.strictEqual(sale.subtotal, 4900);
    assert.strictEqual(sale.orderDiscount, 100);
    assert.strictEqual(sale.totalAmount, 4800);
    assert.strictEqual(sale.changeGiven, 200); // 5000 - 4800
    assert.ok(sale.receiptNumber.startsWith('SE-'));

    // Check stock was safely deducted
    const updatedShirt = await ProductVariant.findById(shirtVariantM._id);
    const updatedBiscuit = await ProductVariant.findById(biscuitVariant._id);

    assert.strictEqual(updatedShirt.currentStock, 33); // 35 - 2
    assert.strictEqual(updatedBiscuit.currentStock, 45); // 50 - 5

    // Check StockMovement records for the sale
    const saleMovements = await StockMovement.find({
      referenceId: sale._id,
      type: STOCK_MOVEMENT_TYPE.SALE,
    });
    assert.strictEqual(saleMovements.length, 2);

    // Verify Item Snapshots
    assert.strictEqual(sale.items[0].productName, 'Cotton Oxford Shirt');
    assert.strictEqual(sale.items[0].sku, 'SHIRT-BLU-M');
    assert.strictEqual(sale.items[0].unitPrice, 2200);
  });

  test('5. Prevent sale when stock is insufficient', async () => {
    const biscuitVariant = createdSnackProduct.variants[0]; // stock is 45

    const { req: failReq, res: failRes, next: failNext } = mockReqRes({
      user: cashierUser,
      body: {
        items: [
          {
            variantId: biscuitVariant._id,
            quantity: 9999, // Way more than available!
          },
        ],
        payments: [{ method: 'cash', amount: 999900 }],
      },
    });

    try {
      await saleController.createSale(failReq, failRes, failNext);
      assert.fail('Should have rejected insufficient stock');
    } catch (err) {
      assert.match(err.message, /Insufficient stock/i);
    }
  });

  test('6. Record Expenses and Validate Financial Profit/Loss Report', async () => {
    // Record Rent Expense: Rs. 1500
    // Record Electricity Expense: Rs. 500
    await Expense.create({
      title: 'Shop Daily Utility Share',
      category: 'Electricity',
      amount: 500,
      createdBy: ownerUser._id,
    });

    await Expense.create({
      title: 'Monthly Rent Allocation',
      category: 'Rent',
      amount: 1500,
      createdBy: ownerUser._id,
    });

    // Run Profit & Loss Report
    const { req: repReq, res: repRes, next: repNext } = mockReqRes({
      user: ownerUser,
      query: {},
    });

    await reportController.getProfitLossReport(repReq, repRes, repNext);
    assert.strictEqual(repRes.statusCode, 200);
    const summary = repRes.data.summary;

    // Sales Revenue was 4800
    // COGS: (2 shirts * 1150) + (5 biscuits * 70) = 2300 + 350 = 2650
    // Gross Profit: 4800 - 2650 = 2150
    // Expenses: 1500 + 500 = 2000
    // Net Profit: 2150 - 2000 = 150
    assert.strictEqual(summary.grossRevenue, 4800);
    assert.strictEqual(summary.totalCOGS, 2650);
    assert.strictEqual(summary.grossProfit, 2150);
    assert.strictEqual(summary.totalOperatingExpenses, 2000);
    assert.strictEqual(summary.netProfit, 150);

    // Payment breakdown
    const pBreakdown = repRes.data.paymentBreakdown;
    assert.strictEqual(pBreakdown.cash, 2800); // 3000 tendered - 200 change = 2800 net cash
    assert.strictEqual(pBreakdown.jazzcash, 2000);
  });
});

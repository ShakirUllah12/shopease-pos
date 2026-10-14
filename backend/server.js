require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB, disconnectDB, isTransactionsSupported } = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');
const Product = require('./src/models/Product');
const Setting = require('./src/models/Setting');
const { seedCatalog, PRODUCTS_DATA } = require('./src/scripts/seedCatalog');

// Route Handlers
const authRoutes = require('./src/routes/authRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const productRoutes = require('./src/routes/productRoutes');
const stockRoutes = require('./src/routes/stockRoutes');
const supplierRoutes = require('./src/routes/supplierRoutes');
const purchaseRoutes = require('./src/routes/purchaseRoutes');
const saleRoutes = require('./src/routes/saleRoutes');
const expenseRoutes = require('./src/routes/expenseRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const settingRoutes = require('./src/routes/settingRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const shiftRoutes = require('./src/routes/shiftRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// System Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'ShopEase POS Backend API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    timezone: process.env.TIMEZONE || 'Asia/Karachi',
    currency: process.env.CURRENCY_CODE || 'PKR',
    transactionsSupported: isTransactionsSupported(),
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/shifts', shiftRoutes);

// Root greeting
app.get('/', (req, res) => {
  res.json({
    message: 'ShopEase POS API Service',
    health: '/api/health',
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Database initialization and catalog auto-seeding helper
async function initStoreDatabase() {
  await connectDB();

  // Auto-seed initial store settings if not initialized
  const settingCount = await Setting.countDocuments();
  if (settingCount === 0) {
    await Setting.create({
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
    console.log('✅ Initialized default ShopEase store settings.');
  }

  // Auto-seed complete retail catalog if catalog is missing items
  const productCount = await Product.countDocuments();
  if (productCount < PRODUCTS_DATA.length) {
    console.log(`🌱 Detected ${productCount} products in database (catalog has ${PRODUCTS_DATA.length}). Ensuring all items are seeded...`);
    await seedCatalog({ quiet: true });
  }
}

// Start Server helper
async function startServer() {
  try {
    await initStoreDatabase();

    const server = app.listen(PORT, () => {
      console.log(`🛍️ ShopEase POS Server running on port ${PORT}`);
      console.log(`📡 Healthcheck available at http://localhost:${PORT}/api/health`);
    });

    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    return { app, server };
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  startServer();
}

module.exports = { app, startServer, initStoreDatabase };

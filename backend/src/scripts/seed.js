require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const Setting = require('../models/Setting');
const User = require('../models/User');
const { ROLES } = require('../config/constants');
const { seedCatalog } = require('./seedCatalog');

async function seedDatabase() {
  try {
    await connectDB();
    console.log('🌱 Starting ShopEase POS comprehensive database seeding...');

    // 1. Seed Core Categories & Catalog Products
    await seedCatalog({ quiet: false });

    // 2. Seed Default Settings
    const existingSettings = await Setting.findOne();
    if (!existingSettings) {
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
      console.log('✅ Seeded default ShopEase Store Settings');
    } else {
      console.log('ℹ️ Store Settings already initialized.');
    }

    // 3. Optional Initial Owner Creation (if no user exists)
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const ownerUsername = process.env.INITIAL_OWNER_USER || 'owner';
      const ownerPassword = process.env.INITIAL_OWNER_PASS || 'Owner@123456';
      const ownerFullName = 'ShopEase Administrator';

      const passwordHash = await User.hashPassword(ownerPassword);
      await User.create({
        username: ownerUsername,
        fullName: ownerFullName,
        email: 'owner@shopease.local',
        passwordHash,
        role: ROLES.OWNER,
        isActive: true,
      });

      console.log(`✅ Created initial Owner account:`);
      console.log(`   Username: ${ownerUsername}`);
      console.log(`   Password: ${ownerPassword}`);
      console.log(`   [Change this password in settings for production environments]`);
    } else {
      console.log(`ℹ️ System already has ${userCount} registered user(s).`);
    }

    console.log('🎉 Database seeding completed successfully!');
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedDatabase();

require('dotenv').config();
const readline = require('readline');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const { ROLES } = require('../config/constants');

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

async function createOwner() {
  try {
    await connectDB();

    console.log('🔐 ShopEase POS — Secure Owner Creation Utility');

    // Get input from CLI arguments or prompt
    const args = process.argv.slice(2);
    let username = args[0];
    let fullName = args[1];
    let password = args[2];
    let email = args[3];

    if (!username) {
      username = await askQuestion('Enter Owner Username: ');
    }
    if (!fullName) {
      fullName = await askQuestion('Enter Owner Full Name: ');
    }
    if (!password) {
      password = await askQuestion('Enter Owner Password (min 6 characters): ');
    }
    if (!email) {
      email = await askQuestion('Enter Owner Email (optional): ');
    }

    if (!username || username.length < 3) {
      console.error('❌ Error: Username must be at least 3 characters.');
      process.exit(1);
    }

    if (!fullName) {
      console.error('❌ Error: Full name is required.');
      process.exit(1);
    }

    if (!password || password.length < 6) {
      console.error('❌ Error: Password must be at least 6 characters.');
      process.exit(1);
    }

    const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUser) {
      console.error(`❌ Error: A user with username "${username}" already exists.`);
      process.exit(1);
    }

    const passwordHash = await User.hashPassword(password);
    const newOwner = await User.create({
      username: username.toLowerCase().trim(),
      name: fullName.trim(),
      fullName: fullName.trim(),
      email: email ? email.toLowerCase().trim() : undefined,
      passwordHash,
      role: ROLES.OWNER,
      isActive: true,
    });

    console.log('✅ Store Owner created successfully!');
    console.log(`   Username: ${newOwner.username}`);
    console.log(`   Name:     ${newOwner.fullName}`);
    console.log(`   Role:     ${newOwner.role}`);

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  }
}

createOwner();

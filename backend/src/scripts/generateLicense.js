#!/usr/bin/env node

/**
 * ShopEase POS - Offline License Key Generator Tool
 * Use this script to generate offline activation keys for your clients.
 *
 * Usage:
 *   node src/scripts/generateLicense.js <MACHINE_ID> [lifetime|1yr|30d] [CLIENT_NAME]
 * Or interactive:
 *   node src/scripts/generateLicense.js
 */

const readline = require('readline');
const { generateOfflineLicenseKey, verifyOfflineLicenseKey } = require('../services/licenseService');

function printLicenseCard(machineId, key, tier, clientName) {
  const line = '═'.repeat(60);
  const tierName =
    tier === 'lifetime'
      ? 'Lifetime Perpetual (No Expiration)'
      : tier === '1yr'
      ? '1 Year (365 Days)'
      : '30 Days Extended Trial';

  console.log(`\n╔${line}╗`);
  console.log(`║             🛍️  SHOPEASE POS OFFLINE LICENSE               ║`);
  console.log(`╠${line}╣`);
  if (clientName) {
    console.log(`║ Client / Store : ${clientName.padEnd(41)}║`);
  }
  console.log(`║ Machine ID     : ${machineId.padEnd(41)}║`);
  console.log(`║ License Tier   : ${tierName.padEnd(41)}║`);
  console.log(`╠${line}╣`);
  console.log(`║ ACTIVATION KEY : ${key.padEnd(41)}║`);
  console.log(`╚${line}╝`);
  console.log('\n📋 Instructions for Client:');
  console.log('1. Open ShopEase POS on the client computer.');
  console.log('2. Click "Activate License" or paste the key when prompted.');
  console.log(`3. Paste Key: ${key}`);
  console.log('4. Software activates permanently and completely OFFLINE!\n');
}

async function main() {
  const args = process.argv.slice(2);

  // Direct CLI Argument Mode
  if (args.length >= 1) {
    const machineId = args[0].trim().toUpperCase();
    const tier = (args[1] || 'lifetime').toLowerCase();
    const clientName = args.slice(2).join(' ').trim();

    if (!/^SHOP-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/.test(machineId)) {
      console.error('\n❌ Error: Machine ID must match format SHOP-XXXX-XXXX-XXXX (e.g. SHOP-33B5-7C61-C5AD)\n');
      process.exit(1);
    }

    const key = generateOfflineLicenseKey(machineId, tier);
    const verify = verifyOfflineLicenseKey(key, machineId);
    if (!verify.valid) {
      console.error('\n❌ Verification failed:', verify.error);
      process.exit(1);
    }

    printLicenseCard(machineId, key, tier, clientName);
    return;
  }

  // Interactive Prompt Mode
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  console.log('\n========================================================');
  console.log('  🔑 ShopEase POS - Offline License Key Generator');
  console.log('========================================================\n');

  try {
    const rawMachineId = await question('Enter Client Machine ID (format SHOP-XXXX-XXXX-XXXX): ');
    const machineId = (rawMachineId || '').trim().toUpperCase();

    if (!/^SHOP-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/.test(machineId)) {
      console.error('\n❌ Error: Invalid Machine ID. Expected format: SHOP-XXXX-XXXX-XXXX (e.g. SHOP-33B5-7C61-C5AD)\n');
      rl.close();
      process.exit(1);
    }

    console.log('\nSelect License Tier:');
    console.log('  1) Lifetime Perpetual (Recommended)');
    console.log('  2) 1 Year (365 Days)');
    console.log('  3) 30 Days Evaluation');
    const tierChoice = await question('Choice [1/2/3, default: 1]: ');

    let tier = 'lifetime';
    if (tierChoice.trim() === '2') tier = '1yr';
    else if (tierChoice.trim() === '3') tier = '30d';

    const clientName = (await question('\nEnter Client / Store Name (Optional): ')).trim();

    const key = generateOfflineLicenseKey(machineId, tier);
    printLicenseCard(machineId, key, tier, clientName);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal error generating license:', err);
    process.exit(1);
  });
}

module.exports = { main };

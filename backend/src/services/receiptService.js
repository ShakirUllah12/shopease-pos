const Sale = require('../models/Sale');

/**
 * Generates an sequential receipt number: SE-YYYYMMDD-XXXX
 * Example: SE-20261013-0001
 */
async function generateReceiptNumber(session = null) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const prefix = `SE-${year}${month}${day}`;

  const query = Sale.findOne({
    receiptNumber: new RegExp(`^${prefix}`),
  }).sort({ receiptNumber: -1 });

  if (session) query.session(session);

  const latestSale = await query;

  let sequence = 1;
  if (latestSale && latestSale.receiptNumber) {
    const parts = latestSale.receiptNumber.split('-');
    if (parts.length === 3) {
      sequence = parseInt(parts[2], 10) + 1;
    }
  }

  // Pad sequence to 4 digits
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
}

module.exports = {
  generateReceiptNumber,
};

const mongoose = require('mongoose');
const { isTransactionsSupported } = require('../config/db');

/**
 * Executes a callback within a managed transaction if replica sets are supported,
 * or gracefully runs in standalone mode with audit safety.
 * 
 * @param {Function} callback - Async function(session) => result
 * @returns {Promise<any>}
 */
async function runWithTransaction(callback) {
  const canUseTransactions = isTransactionsSupported();

  if (canUseTransactions) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } else {
    // Run directly without session for standalone MongoDB
    return await callback(null);
  }
}

module.exports = {
  runWithTransaction,
};

require('dotenv').config();
const mongoose = require('mongoose');

let supportsTransactions = false;

/**
 * Checks if the current MongoDB connection supports multi-document transactions (replica set or mongos).
 */
async function detectTransactionSupport() {
  const uri = process.env.MONGODB_URI || '';
  if (uri.includes('mongodb+srv') || uri.includes('.mongodb.net') || uri.includes('replicaSet=')) {
    supportsTransactions = true;
    console.log('ℹ️ MongoDB Atlas Replica Set detected: Multi-document ACID transactions ENABLED.');
    return;
  }

  try {
    const admin = mongoose.connection.db.admin();
    const serverStatus = await admin.serverStatus();
    // Check if repl or mongos exists in server status
    if (serverStatus.repl || serverStatus.process === 'mongos') {
      supportsTransactions = true;
      console.log('ℹ️ MongoDB Replica Set / Sharded Cluster detected: Multi-document ACID transactions ENABLED.');
    } else {
      supportsTransactions = false;
      console.log('ℹ️ Standalone MongoDB detected: Fallback sequential transaction safeguard ENABLED.');
    }
  } catch (err) {
    supportsTransactions = false;
    console.log('ℹ️ Could not probe server status for transactions. Fallback sequential safeguard ENABLED.');
  }
}

let cachedPromise = null;
let memoryServer = null;

/**
 * Connect to MongoDB with automated fallback to in-memory server if local mongod is not running.
 */
async function connectDB() {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  const isVercel = Boolean(process.env.VERCEL);
  const uri = process.env.MONGODB_URI || (isVercel ? '' : 'mongodb://127.0.0.1:27017/shopease_pos');
  const autoFallback = !isVercel && (process.env.AUTO_FALLBACK_IN_MEMORY_DB !== 'false' || process.env.NODE_ENV === 'test' || !process.env.MONGODB_URI);

  if (isVercel && !uri) {
    const vErr = new Error('MONGODB_URI is missing in Vercel Environment Variables. Please add your MongoDB Atlas connection string in Vercel Settings -> Environment Variables.');
    console.error('❌ ' + vErr.message);
    throw vErr;
  }

  cachedPromise = (async () => {
    try {
      console.log(`🔌 Attempting connection to MongoDB at: ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 10000,
      });
      console.log(`✅ Connected to MongoDB: ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
      await detectTransactionSupport();
      return mongoose.connection;
    } catch (error) {
      if (autoFallback) {
        console.warn(`⚠️ Standard MongoDB unavailable (${error.message}). Checking embedded database...`);
        try {
          let MongoMemoryServer;
          try {
            MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
          } catch (modErr) {
            throw new Error(`Could not connect to MongoDB (${error.message}). Please ensure MongoDB is running or MONGODB_URI is configured.`);
          }
          if (!memoryServer) {
            memoryServer = await MongoMemoryServer.create();
          }
          const memoryUri = memoryServer.getUri();
          console.log(`🚀 Embedded MongoMemoryServer active at: ${memoryUri}`);
          await mongoose.connect(memoryUri);
          supportsTransactions = false;
          return mongoose.connection;
        } catch (memErr) {
          cachedPromise = null;
          console.error('❌ Failed to start embedded in-memory MongoDB:', memErr.message);
          throw memErr;
        }
      }
      cachedPromise = null;
      console.error('❌ MongoDB Connection Error:', error.message);
      throw error;
    }
  })();

  return cachedPromise;
}

/**
 * Disconnect MongoDB cleanly
 */
async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
      memoryServer = null;
    }
    cachedPromise = null;
    console.log('🛑 MongoDB disconnected cleanly.');
  } catch (err) {
    console.error('Error disconnecting MongoDB:', err);
  }
}

/**
 * Returns whether the active connection supports replica set transactions
 */
function isTransactionsSupported() {
  return supportsTransactions;
}

module.exports = {
  connectDB,
  disconnectDB,
  isTransactionsSupported,
};

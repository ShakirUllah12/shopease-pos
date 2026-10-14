const mongoose = require('mongoose');

let mongoMemoryServer = null;
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

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopease_pos';
  const autoFallback = process.env.AUTO_FALLBACK_IN_MEMORY_DB === 'true';

  cachedPromise = (async () => {
    try {
      console.log(`🔌 Attempting connection to MongoDB at: ${uri}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
      console.log(`✅ Connected to MongoDB: ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
      await detectTransactionSupport();
      return mongoose.connection;
    } catch (error) {
      cachedPromise = null;
      if (autoFallback) {
        console.warn(`⚠️ Could not connect to primary MongoDB at ${uri} (${error.message}).`);
        console.log('🚀 Initializing embedded In-Memory MongoDB for local development/testing...');
        try {
          const { MongoMemoryServer } = require('mongodb-memory-server');
          mongoMemoryServer = await MongoMemoryServer.create({
            instance: {
              dbName: 'shopease_pos',
            },
          });
          const memoryUri = mongoMemoryServer.getUri();
          await mongoose.connect(memoryUri);
          console.log(`✅ Connected to Embedded MongoDB: ${memoryUri}`);
          await detectTransactionSupport();
          return mongoose.connection;
        } catch (memErr) {
          console.error('❌ Failed to start embedded MongoDB:', memErr.message);
          throw memErr;
        }
      } else {
        console.error('❌ MongoDB Connection Error:', error.message);
        throw error;
      }
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
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
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

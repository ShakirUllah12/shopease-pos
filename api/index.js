const { app, initStoreDatabase } = require('../backend/server');

let isInitialized = false;

module.exports = async (req, res) => {
  if (!isInitialized) {
    try {
      await initStoreDatabase();
      isInitialized = true;
    } catch (err) {
      console.error('Serverless database initialization error:', err.message);
    }
  }
  return app(req, res);
};

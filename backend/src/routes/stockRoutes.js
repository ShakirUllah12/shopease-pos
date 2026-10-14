const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { authenticate, requireOwner } = require('../middleware/auth');

router.get('/alerts', authenticate, stockController.getLowStockAlerts);
router.get('/movements', authenticate, stockController.getStockMovements);
router.get('/summary', requireOwner, stockController.getInventorySummary);
router.post('/adjust', requireOwner, stockController.manualAdjustStock);

module.exports = router;

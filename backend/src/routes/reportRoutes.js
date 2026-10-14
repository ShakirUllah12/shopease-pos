const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireOwner } = require('../middleware/auth');

router.get('/profit-loss', requireOwner, reportController.getProfitLossReport);
router.get('/by-category-product', requireOwner, reportController.getCategoryAndProductReport);
router.get('/trends', requireOwner, reportController.getDailyTrendReport);

module.exports = router;

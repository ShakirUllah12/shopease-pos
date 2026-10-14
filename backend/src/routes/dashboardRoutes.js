const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireStaff } = require('../middleware/auth');

router.get('/summary', requireStaff, dashboardController.getDashboardSummary);

module.exports = router;

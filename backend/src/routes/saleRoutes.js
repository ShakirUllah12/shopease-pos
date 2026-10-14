const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { authenticate, requireOwner } = require('../middleware/auth');

// Both cashiers and owners can perform sales and search receipts
router.post('/', authenticate, saleController.createSale);
router.get('/', authenticate, saleController.getSales);
router.get('/:identifier', authenticate, saleController.getSaleByReceipt);

// Only owners can refund/void completed sales
router.post('/:id/refund', requireOwner, saleController.refundSale);

module.exports = router;

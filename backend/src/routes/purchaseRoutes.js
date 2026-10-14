const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { requireOwner } = require('../middleware/auth');

// All purchase operations are owner restricted
router.get('/', requireOwner, purchaseController.getPurchases);
router.post('/', requireOwner, purchaseController.createPurchase);
router.get('/:id', requireOwner, purchaseController.getPurchaseById);
router.patch('/:id/receive', requireOwner, purchaseController.markPurchaseReceived);
router.post('/:id/payment', requireOwner, purchaseController.recordPurchasePayment);

module.exports = router;

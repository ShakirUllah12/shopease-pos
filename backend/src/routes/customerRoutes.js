const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate, requireOwner } = require('../middleware/auth');

router.get('/', authenticate, customerController.getCustomers);
router.get('/:id', authenticate, customerController.getCustomerById);
router.post('/', authenticate, customerController.createCustomer);
router.patch('/:id', authenticate, customerController.updateCustomer);
router.post('/:id/payments', authenticate, customerController.recordCustomerPayment);

module.exports = router;

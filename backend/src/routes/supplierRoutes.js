const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authenticate, requireOwner } = require('../middleware/auth');

router.get('/', authenticate, supplierController.getSuppliers);
router.post('/', requireOwner, supplierController.createSupplier);
router.put('/:id', requireOwner, supplierController.updateSupplier);

module.exports = router;

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, requireOwner } = require('../middleware/auth');

// Public catalog endpoint for public website storefront
router.get('/public-catalog', productController.getProducts);

// Read endpoints for staff (cashiers & owners)
router.get('/', authenticate, productController.getProducts);
router.get('/pos-search', authenticate, productController.searchPosProducts);
router.get('/:id', authenticate, productController.getProductById);

// Owner-only write endpoints
router.post('/', requireOwner, productController.createProduct);
router.patch('/:id/status', requireOwner, productController.toggleProductStatus);
router.patch('/:id/toggle-status', requireOwner, productController.toggleProductStatus);
router.patch('/:id', requireOwner, productController.updateProduct);
router.put('/:id', requireOwner, productController.updateProduct);

module.exports = router;

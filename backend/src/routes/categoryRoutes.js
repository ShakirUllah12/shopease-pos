const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, requireOwner } = require('../middleware/auth');

router.get('/public', categoryController.getCategories);
router.get('/', authenticate, categoryController.getCategories);
router.post('/', requireOwner, categoryController.createCategory);
router.patch('/:id', requireOwner, categoryController.updateCategory);
router.put('/:id', requireOwner, categoryController.updateCategory);

module.exports = router;

const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { requireOwner } = require('../middleware/auth');

router.get('/', requireOwner, expenseController.getExpenses);
router.post('/', requireOwner, expenseController.createExpense);
router.put('/:id', requireOwner, expenseController.updateExpense);
router.delete('/:id', requireOwner, expenseController.deleteExpense);

module.exports = router;

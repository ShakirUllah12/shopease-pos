const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const { authenticate, requireOwner } = require('../middleware/auth');

router.get('/current', authenticate, shiftController.getCurrentShift);
router.post('/start', authenticate, shiftController.startShift);
router.post('/:id/cash-movement', authenticate, shiftController.recordCashMovement);
router.post('/:id/close', authenticate, shiftController.closeShift);
router.get('/', authenticate, shiftController.getShiftHistory);
router.get('/:id', authenticate, shiftController.getShiftById);

module.exports = router;

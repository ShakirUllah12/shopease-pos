const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { authenticate, requireOwner } = require('../middleware/auth');

router.get('/public', settingController.getSettings);
router.get('/', authenticate, settingController.getSettings);
router.put('/', requireOwner, settingController.updateSettings);

module.exports = router;

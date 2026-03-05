'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/period.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, ctrl.create);
router.get('/me', protect, ctrl.getMyLogs);
router.patch('/:id', protect, ctrl.updateLog);

module.exports = router;

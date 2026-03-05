'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/lactation.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, ctrl.create);
router.get('/me', protect, ctrl.getMyLogs);
router.delete('/:id', protect, ctrl.deleteLog);

module.exports = router;

'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/session.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.post('/', protect, ctrl.book);
router.get('/me', protect, ctrl.getMySessions);
router.patch('/:id/cancel', protect, ctrl.cancel);
router.get('/', protect, restrictTo('admin'), ctrl.getAll);

module.exports = router;

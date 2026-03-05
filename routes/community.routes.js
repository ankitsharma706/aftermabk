'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/community.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', ctrl.getAll);
router.patch('/:id/join', protect, ctrl.join);
router.patch('/:id/leave', protect, ctrl.leave);

module.exports = router;

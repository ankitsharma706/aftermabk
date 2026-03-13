'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/question.controller');
const { protect } = require('../middleware/auth.middleware');

// Public
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);

// Authenticated
router.post('/', protect, ctrl.create);
router.post('/:id/answer', protect, ctrl.addAnswer);
router.patch('/:id/upvote', protect, ctrl.upvote);
router.delete('/:id', protect, ctrl.remove);

module.exports = router;

'use strict';

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { createNgo, getAllNgos, getNgoById, updateNgo, deleteNgo } = require('../controllers/ngo.controller');

// GET  /api/ngos   (public)
router.get('/', getAllNgos);

// GET  /api/ngos/:ngoId  (public)
router.get('/:ngoId', getNgoById);

// POST /api/ngos   (admin)
router.post(
  '/',
  protect,
  restrictTo('admin'),
  [body('title').notEmpty().withMessage('NGO title required.')],
  validate,
  createNgo
);

// PATCH /api/ngos/:ngoId  (admin)
router.patch('/:ngoId', protect, restrictTo('admin'), updateNgo);

// DELETE /api/ngos/:ngoId  (admin)
router.delete('/:ngoId', protect, restrictTo('admin'), deleteNgo);

module.exports = router;

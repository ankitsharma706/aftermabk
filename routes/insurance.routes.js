'use strict';

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  createInsurancePlan,
  getAllInsurancePlans,
  getInsurancePlanById,
  updateInsurancePlan,
  deleteInsurancePlan,
} = require('../controllers/insurance.controller');

// GET  /api/insurance   (public)
router.get('/', getAllInsurancePlans);

// GET  /api/insurance/:planId  (public)
router.get('/:planId', getInsurancePlanById);

// POST /api/insurance   (admin)
router.post(
  '/',
  protect,
  restrictTo('admin'),
  [
    body('bank_name').notEmpty().withMessage('Bank name required.'),
    body('scheme_name').notEmpty().withMessage('Scheme name required.'),
    body('coverage_min').isInt({ min: 0 }),
    body('coverage_max').isInt({ min: 0 }),
  ],
  validate,
  createInsurancePlan
);

// PATCH /api/insurance/:planId  (admin)
router.patch('/:planId', protect, restrictTo('admin'), updateInsurancePlan);

// DELETE /api/insurance/:planId  (admin)
router.delete('/:planId', protect, restrictTo('admin'), deleteInsurancePlan);

module.exports = router;

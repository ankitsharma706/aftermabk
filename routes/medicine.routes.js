'use strict';

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  createMedicine,
  getAllMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
} = require('../controllers/medicine.controller');

// ── GET /api/medicines         (public — frontend displays catalog)
router.get('/', getAllMedicines);

// ── GET /api/medicines/:medicineId  (public)
router.get('/:medicineId', getMedicineById);

// ── POST /api/medicines        (admin only)
router.post(
  '/',
  protect,
  restrictTo('admin'),
  [
    body('name').notEmpty().withMessage('Medicine name required.'),
    body('category').notEmpty().withMessage('Category required.'),
    body('dose').notEmpty().withMessage('Dose required.'),
    body('frequency').notEmpty().withMessage('Frequency required.'),
  ],
  validate,
  createMedicine
);

// ── PATCH /api/medicines/:medicineId  (admin only)
router.patch('/:medicineId', protect, restrictTo('admin'), updateMedicine);

// ── DELETE /api/medicines/:medicineId (admin only)
router.delete('/:medicineId', protect, restrictTo('admin'), deleteMedicine);

module.exports = router;

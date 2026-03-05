'use strict';

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  createMedicalProfile,
  getMyMedicalProfile,
  getMedicalProfileByUserId,
  updateMyMedicalProfile,
  updateLabValues,
  deleteMedicalProfile,
} = require('../controllers/medicalProfile.controller');

// ── GET    /api/medical-profile/me                 (user: own profile)
router.get('/me', protect, getMyMedicalProfile);

// ── GET    /api/medical-profile/user/:userId        (admin/doctor)
router.get('/user/:userId', protect, restrictTo('admin', 'doctor'), getMedicalProfileByUserId);

// ── POST   /api/medical-profile                    (user: create profile)
router.post('/', protect, createMedicalProfile);

// ── PATCH  /api/medical-profile/me                 (user: update own profile)
router.patch('/me', protect, updateMyMedicalProfile);

// ── PATCH  /api/medical-profile/user/:userId/labs  (admin/doctor: update lab values)
router.patch(
  '/user/:userId/labs',
  protect,
  restrictTo('admin', 'doctor'),
  [
    body('haemoglobin_level').optional().isFloat({ min: 0 }),
    body('thyroid_level').optional().isFloat({ min: 0 }),
    body('vitamin_d3_level').optional().isFloat({ min: 0 }),
    body('glucose_level').optional().isFloat({ min: 0 }),
    body('ferritin_level').optional().isFloat({ min: 0 }),
    body('serum_ferritin_level').optional().isFloat({ min: 0 }),
  ],
  validate,
  updateLabValues
);

// ── DELETE /api/medical-profile/me                 (user: delete own profile)
router.delete('/me', protect, deleteMedicalProfile);

module.exports = router;

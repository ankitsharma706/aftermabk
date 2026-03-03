'use strict';

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
    createDoctor,
    getAllDoctors,
    getDoctorById,
    updateDoctor,
    deleteDoctor,
} = require('../controllers/doctor.controller');

const doctorRules = [
    body('name').trim().isLength({ min: 2, max: 150 }).withMessage('Doctor name required.'),
    body('specialization').notEmpty().withMessage('Specialization required.'),
    body('session_fee').optional().isFloat({ min: 0 }),
    body('rating').optional().isFloat({ min: 0, max: 5 }),
    body('experience_years').optional().isInt({ min: 0 }),
];

// GET  /api/doctors          (public)
router.get('/', getAllDoctors);

// GET  /api/doctors/:doctorId  (public)
router.get('/:doctorId', getDoctorById);

// POST /api/doctors           (admin only)
router.post('/', protect, restrictTo('admin'), doctorRules, validate, createDoctor);

// PATCH /api/doctors/:doctorId (admin only)
router.patch('/:doctorId', protect, restrictTo('admin'), updateDoctor);

// DELETE /api/doctors/:doctorId (admin only)
router.delete('/:doctorId', protect, restrictTo('admin'), deleteDoctor);

module.exports = router;

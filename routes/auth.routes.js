'use strict';

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const {
    register,
    login,
    refreshToken,
    verifyGoogleToken,
    appleCallback,
    sendOtp,
    verifyOtp,
    getMe,
    changePassword,
} = require('../controllers/auth.controller');

// ── Validation rules ──────────────────────────────────────────
const registerRules = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters.')
        .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
        .matches(/[0-9]/).withMessage('Password must contain a number.'),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password confirmation does not match password.');
            }
            return true;
        }),
    body('full_name').trim().isLength({ min: 2, max: 150 }).withMessage('Full name required (2–150 chars).'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone number required, including country code.'),
];

const loginRules = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
    body('password').notEmpty().withMessage('Password required.'),
];

const changePwdRules = [
    body('current_password').notEmpty().withMessage('Current password required.'),
    body('new_password')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters.')
        .matches(/[A-Z]/).withMessage('Must contain an uppercase letter.')
        .matches(/[0-9]/).withMessage('Must contain a number.'),
];

const sendOtpRules = [
    body('phone').notEmpty().withMessage('Phone number required (e.g. +919000000000).'),
];

const verifyOtpRules = [
    body('phone').notEmpty().withMessage('Phone number required.'),
    body('code').notEmpty().withMessage('OTP verification code required.'),
];

// ── Routes ────────────────────────────────────────────────────

// POST /api/auth/register
router.post('/register', registerRules, validate, register);

// POST /api/auth/login
router.post('/login', loginRules, validate, login);

// POST /api/auth/refresh
router.post('/refresh', refreshToken);

// POST /api/auth/google     (mobile: send id_token)
router.post('/google', verifyGoogleToken);

// POST /api/auth/apple
router.post('/apple', appleCallback);

// POST /api/auth/send-otp   (Twilio)
router.post('/send-otp', sendOtpRules, validate, sendOtp);

// POST /api/auth/verify-otp (Twilio)
router.post('/verify-otp', verifyOtpRules, validate, verifyOtp);

// GET  /api/auth/me         (protected)
router.get('/me', protect, getMe);

// PATCH /api/auth/change-password  (protected)
router.patch('/change-password', protect, changePwdRules, validate, changePassword);

module.exports = router;

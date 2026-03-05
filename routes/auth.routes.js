'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// ── User auth ─────────────────────────────────────────────────────────────────
router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/google', ctrl.loginWithGoogle);
router.get('/me', protect, ctrl.getMe);

// ── Doctor auth ───────────────────────────────────────────────────────────────
router.post('/doctor/register', ctrl.doctorRegister); // POST /api/auth/doctor/register
router.post('/doctor/login', ctrl.doctorLogin);       // POST /api/auth/doctor/login

module.exports = router;

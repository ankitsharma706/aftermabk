'use strict';

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  createSession,
  getAllSessions,
  getMySessions,
  getDoctorSessions,
  getSessionById,
  updateSession,
  cancelSession,
  deleteSession,
} = require('../controllers/session.controller');

// ── GET /api/sessions         (admin: all sessions)
router.get('/', protect, restrictTo('admin'), getAllSessions);

// ── GET /api/sessions/me      (user: my sessions)
router.get('/me', protect, getMySessions);

// ── GET /api/sessions/doctor/:doctorId  (doctor or admin)
router.get('/doctor/:doctorId', protect, restrictTo('admin', 'doctor'), getDoctorSessions);

// ── GET /api/sessions/:sessionId
router.get('/:sessionId', protect, getSessionById);

// ── POST /api/sessions        (authenticated user books a session)
router.post(
  '/',
  protect,
  [
    body('doctor_id').notEmpty().withMessage('Doctor ID is required.'),
    body('session_date').isISO8601().withMessage('Valid session_date required (YYYY-MM-DD).'),
    body('session_time').notEmpty().withMessage('session_time is required (HH:MM).'),
    body('session_type').optional().isIn(['video', 'in-person', 'chat', 'phone']),
    body('session_fee').optional().isFloat({ min: 0 }),
  ],
  validate,
  createSession
);

// ── PATCH /api/sessions/:sessionId    (update session)
router.patch('/:sessionId', protect, updateSession);

// ── POST /api/sessions/:sessionId/cancel   (cancel session)
router.post('/:sessionId/cancel', protect, cancelSession);

// ── DELETE /api/sessions/:sessionId   (admin only)
router.delete('/:sessionId', protect, restrictTo('admin'), deleteSession);

module.exports = router;

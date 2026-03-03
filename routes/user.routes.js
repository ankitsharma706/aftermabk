'use strict';

const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { protect, restrictTo, ownResource } = require('../middleware/auth.middleware');
const {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getMyCycleCalendar,
    logCalendarEvent,
    deleteCalendarEvent,
} = require('../controllers/user.controller');

// ── GET /api/users          (admin only)
router.get(
    '/',
    protect,
    restrictTo('admin'),
    [query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 100 })],
    validate,
    getAllUsers
);

// ── GET /api/users/:userId
router.get('/:userId', protect, ownResource, getUserById);

// ── PATCH /api/users/:userId
router.patch(
    '/:userId',
    protect,
    ownResource,
    [
        body('email').optional().isEmail().normalizeEmail(),
        body('full_name').optional().isLength({ min: 2, max: 150 }),
        body('weight_kg').optional().isFloat({ min: 30, max: 300 }),
        body('cycle_length_days').optional().isInt({ min: 21, max: 45 }),
        body('period_duration_days').optional().isInt({ min: 2, max: 10 }),
    ],
    validate,
    updateUser
);

// ── DELETE /api/users/:userId
router.delete('/:userId', protect, ownResource, deleteUser);

// ── Cycle Calendar ────────────────────────────────────────────

// GET /api/users/me/calendar
router.get('/me/calendar', protect, getMyCycleCalendar);

// POST /api/users/me/calendar
router.post(
    '/me/calendar',
    protect,
    [
        body('event_date').isDate().withMessage('event_date must be YYYY-MM-DD.'),
        body('event_type')
            .isIn([
                'period_start', 'period_end', 'ovulation', 'fertile_window',
                'doctor_appointment', 'symptom_peak', 'health_milestone', 'medication_reminder', 'custom',
            ])
            .withMessage('Invalid event_type.'),
    ],
    validate,
    logCalendarEvent
);

// DELETE /api/users/me/calendar/:eventId
router.delete('/me/calendar/:eventId', protect, deleteCalendarEvent);

module.exports = router;

'use strict';

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const {
  createDailyLog,
  getMyLogs,
  getLogById,
  updateDailyLog,
  deleteDailyLog,
  getMySummaries,
  getLatestSummary,
} = require('../controllers/dailyLog.controller');

// ── Validation rules ──────────────────────────────────────────
const logRules = [
  body('sleep_hours').isFloat({ min: 0, max: 24 }).withMessage('sleep_hours: 0–24 required.'),
  body('water_liters').isFloat({ min: 0, max: 20 }).withMessage('water_liters: 0–20 required.'),
  body('pain_intensity').isInt({ min: 0, max: 10 }).withMessage('pain_intensity: 0–10 required.'),
  body('cramps_severity').isInt({ min: 0, max: 10 }).withMessage('cramps_severity: 0–10 required.'),
  body('fatigue_score').isInt({ min: 0, max: 10 }).withMessage('fatigue_score: 0–10 required.'),
  body('energy_level').isInt({ min: 0, max: 10 }).withMessage('energy_level: 0–10 required.'),
  body('log_date').optional().isDate().withMessage('log_date must be YYYY-MM-DD.'),
];

// ─────────────────────────────────────────────────────────────
// DAILY LOGS
// ─────────────────────────────────────────────────────────────

// POST /api/logs
router.post('/', protect, logRules, validate, createDailyLog);

// GET /api/logs
router.get('/', protect, getMyLogs);

// GET /api/logs/:logId
router.get('/:logId', protect, getLogById);

// PATCH /api/logs/:logId
router.patch('/:logId', protect, updateDailyLog);

// DELETE /api/logs/:logId
router.delete('/:logId', protect, deleteDailyLog);

// ─────────────────────────────────────────────────────────────
// HEALTH SUMMARIES (sub-routes on logs router for convenience)
// ─────────────────────────────────────────────────────────────

// GET /api/logs/summaries/all
router.get('/summaries/all', protect, getMySummaries);

// GET /api/logs/summaries/latest
router.get('/summaries/latest', protect, getLatestSummary);

module.exports = router;

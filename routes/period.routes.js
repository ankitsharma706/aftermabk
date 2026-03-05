'use strict';

const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  createPeriod,
  getMyPeriod,
  getPeriodByUserId,
  addCycle,
  updatePeriod,
  deletePeriod,
} = require('../controllers/period.controller');

// ── GET    /api/period/me           (user: get own period data)
router.get('/me', protect, getMyPeriod);

// ── GET    /api/period/user/:userId (admin/doctor: get user period data)
router.get('/user/:userId', protect, restrictTo('admin', 'doctor'), getPeriodByUserId);

// ── POST   /api/period              (user: create period record)
router.post('/', protect, createPeriod);

// ── POST   /api/period/cycle        (user: add new cycle to existing record)
router.post('/cycle', protect, addCycle);

// ── PATCH  /api/period              (user: update settings/predictions)
router.patch('/', protect, updatePeriod);

// ── DELETE /api/period              (user: delete period record)
router.delete('/', protect, deletePeriod);

module.exports = router;

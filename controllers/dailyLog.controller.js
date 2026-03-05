'use strict';
const { DailyLog } = require('../models');

// POST /api/logs  — create or upsert a daily log
exports.create = async (req, res, next) => {
  try {
    const { date, mood_score, pain_level, sleep_hours, water_cups, energy_level, activity_level, symptoms, notes } = req.body;

    if (!date) return res.status(400).json({ status: 'error', message: 'date is required.' });

    const logDate = new Date(date);
    logDate.setUTCHours(0, 0, 0, 0);

    // Upsert — one log per user per day
    const log = await DailyLog.findOneAndUpdate(
      { user_id: req.user._id, date: logDate },
      { $set: { mood_score, pain_level, sleep_hours, water_cups, energy_level, activity_level, symptoms, notes } },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    return res.status(201).json({ status: 'success', data: { log } });
  } catch (err) { next(err); }
};

// GET /api/logs/me
exports.getMyLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const logs = await DailyLog.find({ user_id: req.user._id }).sort({ date: -1 }).limit(limit);
    return res.status(200).json({ status: 'success', results: logs.length, data: { logs } });
  } catch (err) { next(err); }
};

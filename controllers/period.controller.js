'use strict';
const { PeriodLog } = require('../models');

// POST /api/period  — log a new cycle
exports.create = async (req, res, next) => {
  try {
    const {
      cycle_start, cycle_end, cycle_length_days, period_length_days,
      flow_pattern, daily_flow, symptoms, notes,
      next_period_predicted, ovulation_predicted, fertility_window_start, fertility_window_end,
    } = req.body;

    if (!cycle_start) return res.status(400).json({ status: 'error', message: 'cycle_start is required.' });

    const log = await PeriodLog.create({
      user_id: req.user._id,
      cycle_start: new Date(cycle_start),
      cycle_end: cycle_end ? new Date(cycle_end) : undefined,
      cycle_length_days,
      period_length_days,
      flow_pattern,
      daily_flow,
      symptoms,
      notes,
      next_period_predicted,
      ovulation_predicted,
      fertility_window_start,
      fertility_window_end,
    });

    return res.status(201).json({ status: 'success', data: { log } });
  } catch (err) { next(err); }
};

// GET /api/period/me
exports.getMyLogs = async (req, res, next) => {
  try {
    const logs = await PeriodLog.find({ user_id: req.user._id }).sort({ cycle_start: -1 }).limit(12);
    return res.status(200).json({ status: 'success', results: logs.length, data: { logs } });
  } catch (err) { next(err); }
};

// PATCH /api/period/:id
exports.updateLog = async (req, res, next) => {
  try {
    const log = await PeriodLog.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      { $set: req.body },
      { returnDocument: 'after', runValidators: true }
    );
    if (!log) return res.status(404).json({ status: 'error', message: 'Period log not found.' });
    return res.status(200).json({ status: 'success', data: { log } });
  } catch (err) { next(err); }
};

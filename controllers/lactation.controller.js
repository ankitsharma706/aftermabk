'use strict';
const { LactationLog } = require('../models');

// POST /api/lactation
exports.create = async (req, res, next) => {
  try {
    const { feeding_type, side, milk_quantity_ml, duration_minutes, baby_response, notes, timestamp } = req.body;

    if (!feeding_type)
      return res.status(400).json({ status: 'error', message: 'feeding_type is required.' });

    const log = await LactationLog.create({
      user_id: req.user._id,
      feeding_type,
      side: side || '',
      milk_quantity_ml,
      duration_minutes,
      baby_response: baby_response || '',
      notes,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    return res.status(201).json({ status: 'success', data: { log } });
  } catch (err) { next(err); }
};

// GET /api/lactation/me
exports.getMyLogs = async (req, res, next) => {
  try {
    const logs = await LactationLog.find({ user_id: req.user._id }).sort({ timestamp: -1 }).limit(100);
    return res.status(200).json({ status: 'success', results: logs.length, data: { logs } });
  } catch (err) { next(err); }
};

// DELETE /api/lactation/:id
exports.deleteLog = async (req, res, next) => {
  try {
    const log = await LactationLog.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
    if (!log) return res.status(404).json({ status: 'error', message: 'Log not found.' });
    return res.status(204).send();
  } catch (err) { next(err); }
};

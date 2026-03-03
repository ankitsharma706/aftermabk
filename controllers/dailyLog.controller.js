'use strict';

const mongoose = require('mongoose');
const { DailyLog, HealthSummary, User } = require('../models');
const { calculateHealthSummary } = require('../services/healthScoring.service');
const { parsePagination, paginateMeta } = require('../utils/helpers');
const { createError } = require('../middleware/error.middleware');

// ─────────────────────────────────────────────────────────────
// CREATE DAILY LOG (Triggers scoring engine)
// ─────────────────────────────────────────────────────────────
const createDailyLog = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const logDate = req.body.log_date ? new Date(req.body.log_date) : new Date();

    // Normalize date to prevent duplicate logs on same day
    logDate.setUTCHours(0, 0, 0, 0);

    const existingLog = await DailyLog.findOne({ user_id: userId, log_date: logDate });
    if (existingLog) {
      return next(createError(`A log already exists for ${logDate.toISOString().split('T')[0]}. Use PATCH to update it.`, 409));
    }

    const log = await DailyLog.create({
      ...req.body,
      user_id: userId,
      log_date: logDate,
    });

    const user = await User.findById(userId);

    const healthSummaryData = calculateHealthSummary(log, user);

    const summary = await HealthSummary.create({
      user_id: userId,
      log_id: log._id,
      summary_date: logDate,
      ...healthSummaryData,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Daily log recorded. Health summary generated.',
      data: { log, health_summary: summary },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET MY LOGS
// ─────────────────────────────────────────────────────────────
const getMyLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const offset = parsePagination(req.query).offset;
    const { start_date, end_date } = req.query;

    const query = { user_id: req.user._id };
    if (start_date || end_date) {
      query.log_date = {};
      if (start_date) query.log_date.$gte = new Date(start_date);
      if (end_date) query.log_date.$lte = new Date(end_date);
    }

    const count = await DailyLog.countDocuments(query);
    const logs = await DailyLog.find(query)
      .sort({ log_date: -1 })
      .skip(offset)
      .limit(limit);

    return res.status(200).json({
      status: 'success',
      data: { logs, meta: paginateMeta(count, page, limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET ONE LOG BY ID
// ─────────────────────────────────────────────────────────────
const getLogById = async (req, res, next) => {
  try {
    const log = await DailyLog.findOne({ _id: req.params.logId, user_id: req.user._id });
    if (!log) return next(createError('Daily log not found.', 404));

    return res.status(200).json({ status: 'success', data: { log } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// UPDATE DAILY LOG (Recalculates health summary)
// ─────────────────────────────────────────────────────────────
const updateDailyLog = async (req, res, next) => {
  try {
    const log = await DailyLog.findOneAndUpdate(
      { _id: req.params.logId, user_id: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!log) return next(createError('Daily log not found.', 404));

    const user = await User.findById(req.user._id);
    const healthSummaryData = calculateHealthSummary(log, user);

    const summary = await HealthSummary.findOneAndUpdate(
      { log_id: log._id },
      { $set: healthSummaryData },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Log updated. Health summary recalculated.',
      data: { log, health_summary: summary },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE DAILY LOG
// ─────────────────────────────────────────────────────────────
const deleteDailyLog = async (req, res, next) => {
  try {
    const log = await DailyLog.findOneAndDelete({ _id: req.params.logId, user_id: req.user._id });
    if (!log) return next(createError('Daily log not found.', 404));

    await HealthSummary.findOneAndDelete({ log_id: log._id });

    return res.status(200).json({
      status: 'success',
      message: 'Daily log and associated health summary deleted.',
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET ALL SUMMARIES
// ─────────────────────────────────────────────────────────────
const getMySummaries = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const query = { user_id: req.user._id };

    const count = await HealthSummary.countDocuments(query);
    const summaries = await HealthSummary.find(query)
      .sort({ summary_date: -1 })
      .skip(offset)
      .limit(limit);

    return res.status(200).json({
      status: 'success',
      data: { summaries, meta: paginateMeta(count, page, limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET LATEST SUMMARY
// ─────────────────────────────────────────────────────────────
const getLatestSummary = async (req, res, next) => {
  try {
    const summary = await HealthSummary.findOne({ user_id: req.user._id })
      .sort({ summary_date: -1 });

    if (!summary) return next(createError('No health summaries found.', 404));

    return res.status(200).json({ status: 'success', data: { summary } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDailyLog,
  getMyLogs,
  getLogById,
  updateDailyLog,
  deleteDailyLog,
  getMySummaries,
  getLatestSummary,
};

'use strict';

const Period = require('../models/period.model');
const { createError } = require('../middleware/error.middleware');

// ─── CREATE PERIOD LOG ─────────────────────────────────────────────────────────
const createPeriod = async (req, res, next) => {
  try {
    // Only one period document per user — upsert
    const existing = await Period.findOne({ user_id: req.user._id });
    if (existing) {
      return next(createError('Period record already exists. Use PATCH to add cycles.', 400));
    }

    const period = await Period.create({
      user_id: req.user._id,
      ...req.body,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Period tracking record created.',
      data: { period },
    });
  } catch (error) { next(error); }
};

// ─── GET MY PERIOD DATA ────────────────────────────────────────────────────────
const getMyPeriod = async (req, res, next) => {
  try {
    const period = await Period.findOne({ user_id: req.user._id });
    if (!period) return next(createError('No period data found. Please create one first.', 404));
    return res.status(200).json({ status: 'success', data: { period } });
  } catch (error) { next(error); }
};

// ─── GET PERIOD BY USER ID (admin / doctor) ────────────────────────────────────
const getPeriodByUserId = async (req, res, next) => {
  try {
    const period = await Period.findOne({ user_id: req.params.userId });
    if (!period) return next(createError('Period data not found for this user.', 404));
    return res.status(200).json({ status: 'success', data: { period } });
  } catch (error) { next(error); }
};

// ─── ADD A NEW CYCLE ───────────────────────────────────────────────────────────
const addCycle = async (req, res, next) => {
  try {
    const period = await Period.findOneAndUpdate(
      { user_id: req.user._id },
      { $push: { period_cycles: req.body } },
      { returnDocument: 'after', runValidators: true, upsert: true }
    );

    return res.status(200).json({
      status: 'success',
      message: 'New cycle added.',
      data: { period },
    });
  } catch (error) { next(error); }
};

// ─── UPDATE PERIOD SETTINGS / PREDICTIONS ─────────────────────────────────────
const updatePeriod = async (req, res, next) => {
  try {
    const { period_cycles, ...allowedUpdates } = req.body;

    const period = await Period.findOneAndUpdate(
      { user_id: req.user._id },
      { $set: allowedUpdates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!period) return next(createError('Period record not found.', 404));
    return res.status(200).json({
      status: 'success',
      message: 'Period record updated.',
      data: { period },
    });
  } catch (error) { next(error); }
};

// ─── DELETE PERIOD RECORD ──────────────────────────────────────────────────────
const deletePeriod = async (req, res, next) => {
  try {
    const period = await Period.findOneAndDelete({ user_id: req.user._id });
    if (!period) return next(createError('Period record not found.', 404));
    return res.status(200).json({ status: 'success', message: 'Period record deleted.' });
  } catch (error) { next(error); }
};

module.exports = {
  createPeriod,
  getMyPeriod,
  getPeriodByUserId,
  addCycle,
  updatePeriod,
  deletePeriod,
};

'use strict';

const mongoose = require('mongoose');

const dailyFlowSchema = new mongoose.Schema({
  day: Number,
  flow: {
    type: String,
    enum: ['heavy', 'medium', 'light', 'spotting', 'none'],
  },
  pain_level: {
    type: Number,
    min: 0,
    max: 10,
  },
}, { _id: false });

const periodCycleSchema = new mongoose.Schema({
  period_start_date: { type: Date, required: true },
  period_end_date: { type: Date },
  cycle_length_days: { type: Number, default: 28 },
  flow_pattern: {
    type: String,
    enum: ['light', 'medium', 'heavy', 'irregular'],
    default: 'medium',
  },
  daily_flow: [dailyFlowSchema],
  symptoms_reported: { type: [String], default: [] },
  notes: { type: String },
}, { _id: false });

const periodSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  cycle_settings: {
    average_cycle_length_days: { type: Number, default: 28 },
    average_period_length_days: { type: Number, default: 5 },
    cycle_variance_days: { type: Number, default: 2 },
  },
  period_cycles: [periodCycleSchema],
  predictions: {
    next_expected_period: { type: Date },
    fertility_window: {
      start_date: { type: Date },
      end_date: { type: Date },
    },
    predicted_ovulation_day: { type: Date },
  },
  analytics_summary: {
    average_cycle_length: { type: Number },
    average_period_duration: { type: Number },
    average_pain_level: { type: Number },
    cycle_regularity: {
      type: String,
      enum: ['Regular', 'Irregular', 'Unknown'],
      default: 'Unknown',
    },
  },
}, {
  timestamps: true,
});

periodSchema.index({ user_id: 1 });

const Period = mongoose.model('Period', periodSchema);
module.exports = Period;

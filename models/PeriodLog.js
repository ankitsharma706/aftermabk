'use strict';
const mongoose = require('mongoose');

const dailyFlowSchema = new mongoose.Schema({
  day: { type: Number, required: true },
  flow: { type: String, enum: ['heavy', 'medium', 'light', 'spotting', 'none'] },
  pain_level: { type: Number, min: 0, max: 10 },
}, { _id: false });

const periodLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cycle_start: { type: Date, required: true },
  cycle_end: { type: Date },
  cycle_length_days: { type: Number },
  period_length_days: { type: Number },
  flow_pattern: { type: String, enum: ['heavy', 'medium', 'light', 'spotting', ''], default: '' },
  daily_flow: [dailyFlowSchema],
  symptoms: [{ type: String }],
  notes: { type: String },

  // Predictions (updated by app logic)
  next_period_predicted: { type: Date },
  ovulation_predicted: { type: Date },
  fertility_window_start: { type: Date },
  fertility_window_end: { type: Date },
}, {
  timestamps: true,
  collection: 'period_logs',
});

periodLogSchema.index({ user_id: 1, cycle_start: -1 });

module.exports = mongoose.model('PeriodLog', periodLogSchema);

'use strict';
const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },        // one doc per user per day

  mood_score: { type: Number, min: 1, max: 10 },
  pain_level: { type: Number, min: 0, max: 10 },
  sleep_hours: { type: Number, min: 0, max: 24 },
  water_cups: { type: Number, min: 0 },
  energy_level: { type: Number, min: 1, max: 10 },
  activity_level: {
    type: String,
    enum: ['none', 'light', 'moderate', 'intense'],
    default: 'none',
  },

  symptoms: [{ type: String }],
  notes: { type: String },
}, {
  timestamps: true,
  collection: 'daily_logs',
});

dailyLogSchema.index({ user_id: 1, date: -1 });
// One log per user per calendar day
dailyLogSchema.index({ user_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);

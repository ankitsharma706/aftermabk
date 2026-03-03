'use strict';

const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  log_date: {
    type: Date,
    required: true,
    default: Date.now,
  },

  // ── Sleep ─────────────────────────────────────────────────────────────
  sleep_hours: {
    type: Number,
    required: true,
    min: 0,
    max: 24,
  },
  sleep_interruptions: {
    type: Number,
    default: 0,
    min: 0,
  },
  insomnia: {
    type: Boolean,
    default: false,
  },

  // ── Hydration ─────────────────────────────────────────────────────────
  water_liters: {
    type: Number,
    required: true,
    min: 0,
    max: 20,
  },

  // ── Pain & Symptoms ───────────────────────────────────────────────────
  pain_intensity: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
  },
  cramps_severity: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
  },
  pelvic_pressure: {
    type: Boolean,
    default: false,
  },
  back_pain: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
  },

  // ── Activity ──────────────────────────────────────────────────────────
  daily_steps: {
    type: Number,
    default: 0,
    min: 0,
  },
  workout_minutes: {
    type: Number,
    default: 0,
    min: 0,
  },
  fatigue_score: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
  },
  energy_level: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
  },

  // ── Nutrition ─────────────────────────────────────────────────────────
  protein_intake_grams: {
    type: Number,
    default: 0,
    min: 0,
  },
  meal_compliance: {
    type: Boolean,
    default: false,
  },

  // ── Mental Wellness ───────────────────────────────────────────────────
  mood_score: {
    type: Number,
    default: 5,
    min: 0,
    max: 10,
  },
  stress_level: {
    type: String,
    enum: ['Low', 'Moderate', 'High'],
    default: 'Low',
  },

  // ── Mobility ──────────────────────────────────────────────────────────
  mobility_score: {
    type: Number,
    default: 5,
    min: 0,
    max: 10,
  },
  core_strength_score: {
    type: Number,
    default: 5,
    min: 0,
    max: 10,
  },
  posture_score: {
    type: Number,
    default: 5,
    min: 0,
    max: 10,
  },

  // ── Inflammation ──────────────────────────────────────────────────────
  inflammation_markers: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
  },

  // ── Notes ─────────────────────────────────────────────────────────────
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

dailyLogSchema.index({ user_id: 1, log_date: 1 }, { unique: true });

const DailyLog = mongoose.model('DailyLog', dailyLogSchema);
module.exports = DailyLog;

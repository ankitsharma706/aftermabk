'use strict';

const mongoose = require('mongoose');

const healthSummarySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  log_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DailyLog',
    unique: true,
  },
  summary_date: {
    type: Date,
    required: true,
  },

  // ── Core Metrics ──────────────────────────────────────────────────────
  hydration_ratio: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  sleep_quality: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  pelvic_index: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
  activity_load: {
    type: Number,
    required: true,
  },

  // ── Readiness Indices ─────────────────────────────────────────────────
  tissue_restoration: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  pelvic_resilience: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  core_alignment: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },

  // ── AFTERMA Readiness Score ───────────────────────────────────────────
  afterma_readiness_score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  risk_level: {
    type: String,
    enum: ['Optimal', 'Stable', 'Moderate Risk', 'High Risk'],
    required: true,
  },

  // ── Pain Assessment ───────────────────────────────────────────────────
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

  // ── Behavioral Patterns ───────────────────────────────────────────────
  hydration_adherence: {
    type: Number,
    default: 0,
  },
  rest_efficiency: {
    type: Number,
    default: 0,
  },

  // ── Cycle Health ──────────────────────────────────────────────────────
  flow_intensity: {
    type: String,
  },
  ovulation_window: {
    type: Boolean,
    default: false,
  },
  associated_symptoms: {
    type: [String],
    default: [],
  },

  // ── AI Flags ──────────────────────────────────────────────────────────
  ai_flags: {
    doctor_consultation_needed: { type: Boolean, default: false },
    hydration_improvement_suggested: { type: Boolean, default: false },
    rest_improvement_suggested: { type: Boolean, default: false },
    activity_warning: { type: Boolean, default: false },
    pain_alert: { type: Boolean, default: false },
    inflammation_alert: { type: Boolean, default: false },
  },

  // ── Alerts ────────────────────────────────────────────────────────────
  alerts: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,
});

healthSummarySchema.index({ user_id: 1, summary_date: 1 });
healthSummarySchema.index({ risk_level: 1 });

const HealthSummary = mongoose.model('HealthSummary', healthSummarySchema);
module.exports = HealthSummary;

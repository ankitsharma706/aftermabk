'use strict';

const mongoose = require('mongoose');

const insurancePlanSchema = new mongoose.Schema({
  bank_name: {
    type: String,
    required: true,
  },
  scheme_name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  coverage_areas: {
    type: [String],
    default: [],
  },

  // ── Eligibility ───────────────────────────────────────────────────────
  required_age: {
    type: Number,
    default: 18,
    min: 0,
  },
  max_age: {
    type: Number,
    default: 65,
  },

  // ── Coverage Financials ───────────────────────────────────────────────
  coverage_min: {
    type: Number,
    default: 0,
    min: 0,
  },
  coverage_max: {
    type: Number,
    default: 0,
    min: 0,
  },
  premium_monthly: Number,
  premium_yearly: Number,

  // ── Statistics ────────────────────────────────────────────────────────
  approval_rate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  processing_days: {
    type: Number,
    default: 7,
    min: 1,
  },
  clients_served: {
    type: Number,
    default: 0,
    min: 0,
  },

  // ── Meta ──────────────────────────────────────────────────────────────
  logo_url: String,
  apply_url: String,
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

insurancePlanSchema.index({ bank_name: 1 });
insurancePlanSchema.index({ active: 1 });
insurancePlanSchema.index({ coverage_min: 1, coverage_max: 1 });

const InsurancePlan = mongoose.model('InsurancePlan', insurancePlanSchema);
module.exports = InsurancePlan;

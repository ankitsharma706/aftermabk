'use strict';
const mongoose = require('mongoose');

const insurancePlanSchema = new mongoose.Schema({
  scheme_name: { type: String, required: true, trim: true },
  bank_name: { type: String },
  description: { type: String },
  eligibility: { type: String },
  coverage: { type: String },
  active: { type: Boolean, default: true },
}, {
  timestamps: true,
  collection: 'insurance_plans',
});

module.exports = mongoose.model('InsurancePlan', insurancePlanSchema);

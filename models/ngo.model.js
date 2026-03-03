'use strict';

const mongoose = require('mongoose');

const ngoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 200,
  },
  awareness_info: {
    type: String,
  },
  description: {
    type: String,
  },
  focus_areas: {
    type: [String],
    default: [],
  },
  location: String,
  city: String,
  state: String,
  country: {
    type: String,
    default: 'India',
  },
  support_number: String,
  email: {
    type: String,
    lowercase: true,
  },
  website_url: String,
  logo_url: String,
  beneficiaries_count: {
    type: Number,
    default: 0,
  },
  active_support: {
    type: Boolean,
    default: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

ngoSchema.index({ location: 1 });
ngoSchema.index({ active_support: 1 });

const Ngo = mongoose.model('Ngo', ngoSchema);
module.exports = Ngo;

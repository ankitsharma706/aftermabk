'use strict';
const mongoose = require('mongoose');

const ngoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  awareness_info: { type: String },
  category: { type: String },
  location: { type: String },
  address: { type: String },
  support_number: { type: String },
  email: { type: String },
  website: { type: String },
  operating_hours: { type: String },
  emergency_support: { type: Boolean, default: false },
  active_support: { type: Boolean, default: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  beneficiaries_served: { type: Number, default: 0 },
}, {
  timestamps: true,
  collection: 'ngos',
});

module.exports = mongoose.model('Ngo', ngoSchema);

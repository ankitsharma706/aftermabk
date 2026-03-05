'use strict';
const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String },
  dose: { type: String },
  frequency: { type: String },
  instructions: { type: String },
  duration: { type: String },
  purpose: { type: String },
  is_active: { type: Boolean, default: true },
}, {
  timestamps: true,
  collection: 'medicines',
});

module.exports = mongoose.model('Medicine', medicineSchema);

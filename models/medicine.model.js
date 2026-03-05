'use strict';

const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  dose: {
    type: String,
    required: true,
  },
  frequency: {
    type: String,
    required: true,
  },
  instructions: {
    type: String,
  },
  duration: {
    type: String,
  },
  purpose: {
    type: String,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

medicineSchema.index({ category: 1 });
medicineSchema.index({ name: 1 });

const Medicine = mongoose.model('Medicine', medicineSchema);
module.exports = Medicine;

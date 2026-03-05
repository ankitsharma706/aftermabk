'use strict';
const mongoose = require('mongoose');

const lactationLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now },
  feeding_type: { type: String, enum: ['breast', 'bottle', 'pump'], required: true },
  side: { type: String, enum: ['left', 'right', 'both', ''], default: '' },
  milk_quantity_ml: { type: Number, min: 0 },
  duration_minutes: { type: Number, min: 0 },
  baby_response: { type: String, enum: ['happy', 'sleepy', 'fussy', 'refused', ''], default: '' },
  notes: { type: String },
}, {
  timestamps: true,
  collection: 'lactation_logs',
});

lactationLogSchema.index({ user_id: 1 });
lactationLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('LactationLog', lactationLogSchema);

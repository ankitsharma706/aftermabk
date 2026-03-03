'use strict';

const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  event_date: {
    type: Date,
    required: true,
  },
  event_type: {
    type: String,
    enum: [
      'period_start',
      'period_end',
      'ovulation',
      'fertile_window',
      'doctor_appointment',
      'symptom_peak',
      'health_milestone',
      'medication_reminder',
      'custom',
    ],
    required: true,
  },
  title: String,
  description: String,

  // ── Period-specific ───────────────────────────────────────────────────
  flow_intensity: {
    type: String,
    enum: ['spotting', 'light', 'medium', 'heavy'],
  },
  cramps_severity: {
    type: Number,
    min: 0,
    max: 10,
  },
  symptoms: {
    type: [String],
    default: [],
  },

  // ── Ovulation-specific ────────────────────────────────────────────────
  is_ovulation_predicted: {
    type: Boolean,
    default: false,
  },
  is_fertile_window: {
    type: Boolean,
    default: false,
  },

  // ── Flags ─────────────────────────────────────────────────────────────
  is_confirmed: {
    type: Boolean,
    default: false,
  },
  reminder_set: {
    type: Boolean,
    default: false,
  },
  color_tag: {
    type: String,
  },
}, {
  timestamps: true,
});

calendarEventSchema.index({ user_id: 1 });
calendarEventSchema.index({ event_date: 1 });
calendarEventSchema.index({ event_type: 1 });

const CalendarEvent = mongoose.model('CalendarEvent', calendarEventSchema);
module.exports = CalendarEvent;

'use strict';

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doctor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  session_date: {
    type: Date,
    required: true,
  },
  session_time: {
    type: String,
    required: true,
  },
  session_type: {
    type: String,
    enum: ['video', 'in-person', 'chat', 'phone'],
    default: 'video',
  },
  session_status: {
    type: String,
    enum: ['upcoming', 'completed', 'cancelled', 'no-show'],
    default: 'upcoming',
  },
  session_fee: {
    type: Number,
    default: 0,
    min: 0,
  },
  session_currency: {
    type: String,
    default: 'INR',
  },
  session_notes: {
    type: String,
  },
  prescription_url: {
    type: String,
  },
  meeting_link: {
    type: String,
  },
  cancelled_reason: {
    type: String,
  },
}, {
  timestamps: true,
});

sessionSchema.index({ user_id: 1 });
sessionSchema.index({ doctor_id: 1 });
sessionSchema.index({ session_date: 1 });
sessionSchema.index({ session_status: 1 });

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;

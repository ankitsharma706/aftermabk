'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  registration_number: { type: String },

  // ── Authentication ──────────────────────────────────────────────────
  password_hash: { type: String, select: false }, // bcrypt hash, hidden by default

  specialization: { type: String, required: true },
  sub_specialty: { type: String },
  designation: { type: String },
  credentials: { type: String },
  quote: { type: String },

  profile_picture_url: { type: String },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  review_count: { type: Number, default: 0 },

  location: { type: String },
  facility_name: { type: String },
  facility_address: { type: String },
  experience_years: { type: Number, default: 0 },

  session_fee: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },

  available_for_booking: { type: Boolean, default: true },
  active: { type: Boolean, default: true },
  verified: { type: Boolean, default: false },
}, {
  timestamps: true,
  collection: 'doctors',
});

doctorSchema.index({ specialization: 1 });
doctorSchema.index({ location: 1 });

/**
 * Compare a plain-text password against the stored bcrypt hash.
 * Usage: await doctor.comparePassword('myPassword')
 */
doctorSchema.methods.comparePassword = async function (plainPassword) {
  if (!this.password_hash) return false;
  return bcrypt.compare(plainPassword, this.password_hash);
};

module.exports = mongoose.model('Doctor', doctorSchema);

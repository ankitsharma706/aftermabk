'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  full_name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  phone: { type: String, trim: true },
  role: { type: String, enum: ['user', 'doctor', 'admin'], default: 'user' },
  is_active: { type: Boolean, default: true },

  // Personal
  dob: { type: Date },
  blood_group: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', ''] },
  phase: { type: String, enum: ['pregnant', 'postpartum', 'general', 'perimenopause', ''], default: 'general' },
  delivery_type: { type: String, enum: ['normal', 'c-section', ''], default: '' },

  // Identity & Address
  aadhar_number: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  country: { type: String, default: 'India' },

  // Vitals
  height_cm: { type: Number },
  weight_kg: { type: Number },
  bmi: { type: Number },

  // Lab Values
  haemoglobin: { type: Number },
  thyroid: { type: Number },
  vitamin_d3: { type: Number },
  glucose: { type: Number },
  ferritin: { type: Number },
  serum_ferritin: { type: Number },

  // Health
  symptoms: [{ type: String }],

  // Family
  family: {
    contact_name: { type: String },
    contact_phone: { type: String },
    relation: { type: String },
  },
  caregiver_permissions: {
    canViewMood: { type: Boolean, default: true },
    canViewPhysical: { type: Boolean, default: true },
    canViewMedicalHistory: { type: Boolean, default: false },
    canViewAppointments: { type: Boolean, default: true },
  },

  // Preferences
  preferences: {
    language: { type: String, default: 'English' },
    reminder_time: { type: String, default: '08:00' },
  },
  notifications: {
    exerciseReminders: { type: Boolean, default: true },
    hydrationAlerts: { type: Boolean, default: true },
    moodCheckins: { type: Boolean, default: true },
    careConnectUpdates: { type: Boolean, default: true },
    sosConfirmations: { type: Boolean, default: true },
  },

  profile_picture_url: { type: String },
}, {
  timestamps: true,
  collection: 'users',
});

// Compare password helper
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password_hash);
};

module.exports = mongoose.model('User', userSchema);

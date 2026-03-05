'use strict';

const mongoose = require('mongoose');

// Full medical profile as seen in patient_medical_report.html & profile.json
const medicalProfileSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  // ── Identity & Basic Info ─────────────────────────────────────────────
  blood_group: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  aadhar_number: {
    type: String,
    select: false,
  },

  // ── Address ───────────────────────────────────────────────────────────
  address: String,
  city: String,
  state: String,
  pincode: String,
  country: { type: String, default: 'India' },

  // ── Body Metrics ──────────────────────────────────────────────────────
  weight_kg: { type: Number, min: 20, max: 300 },
  height_cm: { type: Number, min: 50, max: 250 },
  bmi: { type: Number },

  // ── Lab Values (as in patient_medical_report.html) ────────────────────
  haemoglobin_level: { type: Number },          // g/dL
  thyroid_level: { type: Number },              // µIU/mL (TSH)
  vitamin_d3_level: { type: Number },           // ng/mL
  glucose_level: { type: Number },              // mg/dL (fasting)
  ferritin_level: { type: Number },             // ng/mL
  serum_ferritin_level: { type: Number },       // ng/mL

  // ── Lab Risk Assessment ───────────────────────────────────────────────
  lab_risk_assessment: {
    hemoglobin_status: { type: String, enum: ['normal', 'low', 'high'], default: 'normal' },
    ferritin_status: { type: String, enum: ['normal', 'low', 'high'], default: 'normal' },
    vitamin_d_status: { type: String, enum: ['normal', 'deficient', 'sufficient'], default: 'normal' },
    thyroid_status: { type: String, enum: ['normal', 'low', 'high'], default: 'normal' },
    glucose_status: { type: String, enum: ['normal', 'low', 'high', 'diabetic'], default: 'normal' },
  },

  // ── Conditions & Allergies ────────────────────────────────────────────
  symptoms: { type: [String], default: [] },
  current_conditions: { type: [String], default: [] },
  allergies: { type: [String], default: [] },
  medical_history: { type: [String], default: [] },

  // ── Assigned Doctor ───────────────────────────────────────────────────
  assigned_doctor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
  },
  insurance_id: {
    type: String,
  },

  // ── Emergency / Family Contact ────────────────────────────────────────
  family: {
    primary_contact_name: String,
    primary_contact_number: String,
    family_member_name: String,
    relationship: String,
  },
}, {
  timestamps: true,
});

// Auto-calculate BMI middleware
medicalProfileSchema.pre('save', function () {
  if (this.weight_kg && this.height_cm) {
    const heightM = this.height_cm / 100;
    this.bmi = parseFloat((this.weight_kg / (heightM * heightM)).toFixed(1));
  }
});

medicalProfileSchema.index({ user_id: 1 });

const MedicalProfile = mongoose.model('MedicalProfile', medicalProfileSchema);
module.exports = MedicalProfile;

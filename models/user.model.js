'use strict';

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // ── Identity / Core Auth ──────────────────────────────────────────────
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true,
    },
    password_hash: {
        type: String,
        select: false,
    },
    phone: {
        type: String,
        unique: true,
        sparse: true,
    },
    auth_provider: {
        type: String,
        enum: ['local', 'google', 'apple', 'twilio'],
        default: 'local',
    },
    provider_id: {
        type: String,
    },

    // ── Profile Fields (from profile.json) ────────────────────────────────
    person_id: { type: Number },
    full_name: { type: String, trim: true, default: 'User' },
    Dob: { type: Date },
    blood_group: { type: String },
    cycle_length_days: { type: Number, default: 28 },
    delivery_type: { type: String },
    phase: { type: String },
    profile_picture_url: { type: String },

    // ── Relation & Reference IDs ──────────────────────────────────────────
    summary_id: { type: String },
    period_id: { type: String },
    log_id: { type: String },
    session_id: { type: String },
    booking_id: { type: String },
    insurance_id: { type: String },
    care_circle_id: { type: String },
    doctor_id: { type: String },

    // ── KYC & Address ─────────────────────────────────────────────────────
    aadhar_number: { type: String, select: false },
    address: { type: String },
    city: { type: String },
    pincode: { type: String },
    state: { type: String },
    country: { type: String, default: 'India' },

    // ── Vitals & Lab Measurements ─────────────────────────────────────────
    weight_kg: { type: Number },
    height_cm: { type: Number },
    bmi: { type: Number },
    haemoglobin_level: { type: Number },
    thyroid_level: { type: Number },
    vitamin_d3_level: { type: Number },
    glucose_level: { type: Number },
    ferritin_level: { type: Number },
    serum_ferritin_level: { type: Number },
    symboms: { type: [String], default: [] }, // directly matching json spelling

    // ── Nested Contact Object ─────────────────────────────────────────────
    contact: {
        email: { type: String },
        phone: { type: String },
    },

    // ── Family / Caregiver ────────────────────────────────────────────────
    family: {
        primary_contact_name: { type: String },
        primary_contact_number: { type: String },
        family_member_name: { type: String },
        relationship: { type: String },
    },

    // ── Settings & Preferences ────────────────────────────────────────────
    privacy_mode: {
        type: mongoose.Schema.Types.Mixed, // Can be boolean (true) or String like 'Public'
        default: true,
    },
    preferences: {
        preferred_language: { type: String },
        preferred_reminder_time: { type: String },
        data_visibility: { type: [String], default: [] },
    },

    // ── Appointments & Resources ──────────────────────────────────────────
    appointments: {
        last_visit: { type: Date },
        next_appointment: { type: Date },
        mode: { type: String },
    },
    resource_library: {
        recommended_today: [{
            title: String,
            category: String,
            duration_minutes: Number,
        }]
    },

    // ── Status & Subscriptions ────────────────────────────────────────────
    subscription: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    is_verified: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin', 'doctor'], default: 'user' },
    last_login_at: { type: Date },

}, {
    timestamps: true,
});

// Auto-calculate BMI
userSchema.pre('save', function () {
    if (this.weight_kg && this.height_cm) {
        const heightM = this.height_cm / 100;
        this.bmi = parseFloat((this.weight_kg / (heightM * heightM)).toFixed(1));
    }
});

userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ auth_provider: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;

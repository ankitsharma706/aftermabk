'use strict';

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // ── Identity ──────────────────────────────────────────────────────────
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
    auth_provider: {
        type: String,
        enum: ['local', 'google', 'apple', 'twilio'],
        default: 'local',
    },
    provider_id: {
        type: String,
    },

    // ── Profile ───────────────────────────────────────────────────────────
    full_name: {
        type: String,
        trim: true,
        default: 'User',
    },
    dob: {
        type: Date,
    },
    profile_picture_url: {
        type: String,
    },
    phone: {
        type: String,
        unique: true,
        sparse: true,
    },
    preferred_language: {
        type: String,
        default: 'English',
    },
    privacy_mode: {
        type: String,
        enum: ['Private', 'Family', 'Doctor', 'Public'],
        default: 'Private',
    },

    // ── Medical / Maternity ───────────────────────────────────────────────
    maternity_stage: {
        type: String,
        enum: ['Pregnant', 'Postpartum', 'Recovered', 'Tracking'],
        default: 'Postpartum',
    },
    delivery_method: {
        type: String,
        enum: ['Normal', 'C-section', 'Assisted', 'Unknown'],
        default: 'Unknown',
    },
    delivery_date: {
        type: Date,
    },
    weight_kg: {
        type: Number,
        min: 30,
        max: 300,
    },
    height_cm: {
        type: Number,
    },
    medical_history: {
        type: [String],
        default: [],
    },
    allergies: {
        type: [String],
        default: [],
    },
    current_medications: {
        type: [String],
        default: [],
    },

    // ── Caregiver ─────────────────────────────────────────────────────────
    caregiver_name: String,
    caregiver_relationship: String,
    caregiver_phone: String,
    emergency_contact: String,

    // ── Period Cycle Fields ───────────────────────────────────────────────
    cycle_length_days: {
        type: Number,
        default: 28,
        min: 21,
        max: 45,
    },
    period_duration_days: {
        type: Number,
        default: 5,
        min: 2,
        max: 10,
    },
    last_period_date: {
        type: Date,
    },
    flow_intensity: {
        type: String,
        enum: ['light', 'medium', 'heavy', 'spotting'],
        default: 'medium',
    },

    // ── Subscription ──────────────────────────────────────────────────────
    subscription_plan: {
        type: String,
        default: 'Free',
    },
    subscription_status: {
        type: String,
        enum: ['Active', 'Inactive', 'Trial'],
        default: 'Trial',
    },
    subscription_renewal_date: {
        type: Date,
    },

    // ── Status ────────────────────────────────────────────────────────────
    is_active: {
        type: Boolean,
        default: true,
    },
    is_verified: {
        type: Boolean,
        default: false,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'doctor'],
        default: 'user',
    },
    last_login_at: {
        type: Date,
    },
}, {
    timestamps: true,
});

userSchema.index({ maternity_stage: 1 });
userSchema.index({ auth_provider: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;

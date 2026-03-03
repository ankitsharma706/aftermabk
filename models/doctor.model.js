'use strict';

const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 150,
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
    },
    phone: {
        type: String,
    },
    password_hash: {
        type: String,
        select: false,
    },
    profile_picture_url: {
        type: String,
    },

    // ── Professional Details ───────────────────────────────────────────────
    specialization: {
        type: String,
        required: true,
    },
    expertise_area: {
        type: String,
    },
    type: {
        type: String,
    },
    worked_on: {
        type: String,
    },
    experience_years: {
        type: Number,
        default: 0,
        min: 0,
    },
    qualifications: {
        type: [String],
        default: [],
    },
    languages: {
        type: [String],
        default: ['English'],
    },

    // ── Location ──────────────────────────────────────────────────────────
    location: String,
    address: String,
    hospital: String,
    city: String,
    state: String,

    // ── Availability & Fees ───────────────────────────────────────────────
    session_fee: {
        type: Number,
        default: 0,
        min: 0,
    },
    consultation_modes: {
        type: [String],
        default: ['In-person'],
    },
    available_slots: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },

    // ── Ratings ───────────────────────────────────────────────────────────
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    total_reviews: {
        type: Number,
        default: 0,
        min: 0,
    },

    // ── Status ────────────────────────────────────────────────────────────
    active: {
        type: Boolean,
        default: true,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    registration_number: {
        type: String,
    },
}, {
    timestamps: true,
});

doctorSchema.index({ specialization: 1 });
doctorSchema.index({ location: 1 });
doctorSchema.index({ city: 1 });
doctorSchema.index({ active: 1 });
doctorSchema.index({ rating: -1 });

const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor;

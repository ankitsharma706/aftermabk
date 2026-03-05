'use strict';
const bcrypt = require('bcryptjs');
const { Doctor } = require('../models');

// ─── Allowed update fields ─────────────────────────────────────────────────────
const ALLOWED_UPDATE = [
    'name', 'email', 'phone', 'registration_number',
    'specialization', 'sub_specialty', 'designation', 'credentials', 'quote',
    'profile_picture_url', 'location', 'facility_name', 'facility_address',
    'experience_years', 'session_fee', 'currency',
    'available_for_booking', 'active',
];

const buildUpdate = (body) => {
    const update = {};
    for (const key of ALLOWED_UPDATE) {
        if (body[key] !== undefined) update[key] = body[key];
    }
    return update;
};

// ─── GET /api/doctors ──────────────────────────────────────────────────────────
// Public – list all active doctors with optional filters
exports.getAll = async (req, res, next) => {
    try {
        const { specialization, location, available, page = 1, limit = 20 } = req.query;
        const filter = { active: true };
        if (specialization) filter.specialization = new RegExp(specialization, 'i');
        if (location) filter.location = new RegExp(location, 'i');
        if (available !== undefined) filter.available_for_booking = available === 'true';

        const skip = (Number(page) - 1) * Number(limit);
        const [doctors, total] = await Promise.all([
            Doctor.find(filter).sort({ rating: -1, experience_years: -1 }).skip(skip).limit(Number(limit)),
            Doctor.countDocuments(filter),
        ]);

        return res.status(200).json({
            status: 'success',
            results: doctors.length,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            data: { doctors },
        });
    } catch (err) { next(err); }
};

// ─── GET /api/doctors/:id ──────────────────────────────────────────────────────
// Public – get a single doctor by ID
exports.getById = async (req, res, next) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor || !doctor.active)
            return res.status(404).json({ status: 'error', message: 'Doctor not found.' });
        return res.status(200).json({ status: 'success', data: { doctor } });
    } catch (err) { next(err); }
};

// ─── POST /api/doctors ──────────────────────── (admin only) ───────────────────
// Admin can manually create a doctor record (without setting a password)
exports.create = async (req, res, next) => {
    try {
        const { name, specialization, email } = req.body;
        if (!name || !specialization)
            return res.status(400).json({ status: 'error', message: 'name and specialization are required.' });

        if (email) {
            const existing = await Doctor.findOne({ email: email.toLowerCase() });
            if (existing)
                return res.status(409).json({ status: 'error', message: 'A doctor with this email already exists.' });
        }

        // If admin sets a password, hash it before saving
        const body = { ...req.body };
        if (body.password) {
            body.password_hash = await bcrypt.hash(body.password, 12);
            delete body.password;
        }

        const doctor = await Doctor.create(body);
        const safeDoctor = doctor.toObject();
        delete safeDoctor.password_hash;

        return res.status(201).json({ status: 'success', data: { doctor: safeDoctor } });
    } catch (err) { next(err); }
};

// ─── PATCH /api/doctors/:id ─────────────────── (admin only) ──────────────────
exports.update = async (req, res, next) => {
    try {
        const update = buildUpdate(req.body);
        if (req.body.verified !== undefined) update.verified = req.body.verified;

        // Admin can also reset a doctor's password
        if (req.body.password) {
            update.password_hash = await bcrypt.hash(req.body.password, 12);
        }

        if (Object.keys(update).length === 0)
            return res.status(400).json({ status: 'error', message: 'No valid fields to update.' });

        const doctor = await Doctor.findByIdAndUpdate(
            req.params.id,
            { $set: update },
            { returnDocument: 'after', runValidators: false }
        );

        if (!doctor) return res.status(404).json({ status: 'error', message: 'Doctor not found.' });

        const safeDoctor = doctor.toObject();
        delete safeDoctor.password_hash;
        return res.status(200).json({ status: 'success', data: { doctor: safeDoctor } });
    } catch (err) { next(err); }
};

// ─── DELETE /api/doctors/:id ────────────────── (admin only) ──────────────────
// Soft delete — sets active: false
exports.remove = async (req, res, next) => {
    try {
        const doctor = await Doctor.findByIdAndUpdate(
            req.params.id,
            { active: false },
            { returnDocument: 'after' }
        );
        if (!doctor) return res.status(404).json({ status: 'error', message: 'Doctor not found.' });
        return res.status(200).json({ status: 'success', message: 'Doctor deactivated successfully.' });
    } catch (err) { next(err); }
};

// ─── DELETE /api/doctors/:id/hard ─────────────── (admin only) ────────────────
// Permanent delete
exports.hardDelete = async (req, res, next) => {
    try {
        const doctor = await Doctor.findByIdAndDelete(req.params.id);
        if (!doctor) return res.status(404).json({ status: 'error', message: 'Doctor not found.' });
        return res.status(200).json({ status: 'success', message: 'Doctor permanently deleted.' });
    } catch (err) { next(err); }
};

// ─── GET /api/doctors/me ──────────────── (doctor auth required) ──────────────
exports.getMe = async (req, res, next) => {
    try {
        const doctor = await Doctor.findById(req.user._id);
        if (!doctor) return res.status(404).json({ status: 'error', message: 'Doctor profile not found.' });
        return res.status(200).json({ status: 'success', data: { doctor } });
    } catch (err) { next(err); }
};

// ─── PATCH /api/doctors/me ────────────── (doctor auth required) ──────────────
exports.updateMe = async (req, res, next) => {
    try {
        const update = buildUpdate(req.body);
        delete update.verified;  // doctors cannot self-verify
        delete update.active;    // doctors cannot self-deactivate through this route

        if (Object.keys(update).length === 0)
            return res.status(400).json({ status: 'error', message: 'No valid fields to update.' });

        const doctor = await Doctor.findByIdAndUpdate(
            req.user._id,
            { $set: update },
            { returnDocument: 'after', runValidators: false }
        );

        if (!doctor) return res.status(404).json({ status: 'error', message: 'Doctor profile not found.' });
        return res.status(200).json({ status: 'success', data: { doctor } });
    } catch (err) { next(err); }
};

// ─── PATCH /api/doctors/me/password ──── (doctor auth required) ───────────────
// Doctor changes their own password
exports.changePassword = async (req, res, next) => {
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password)
            return res.status(400).json({ status: 'error', message: 'current_password and new_password are required.' });

        if (new_password.length < 8)
            return res.status(400).json({ status: 'error', message: 'new_password must be at least 8 characters.' });

        // Fetch with password_hash (it is hidden by default)
        const doctor = await Doctor.findById(req.user._id).select('+password_hash');
        if (!doctor) return res.status(404).json({ status: 'error', message: 'Doctor not found.' });

        const isMatch = await doctor.comparePassword(current_password);
        if (!isMatch) return res.status(401).json({ status: 'error', message: 'Current password is incorrect.' });

        doctor.password_hash = await bcrypt.hash(new_password, 12);
        await doctor.save();

        return res.status(200).json({ status: 'success', message: 'Password updated successfully.' });
    } catch (err) { next(err); }
};

// ─── DELETE /api/doctors/me ───────────── (doctor auth required) ──────────────
// Doctor soft-deletes their own account
exports.deleteMe = async (req, res, next) => {
    try {
        const doctor = await Doctor.findByIdAndUpdate(
            req.user._id,
            { active: false },
            { returnDocument: 'after' }
        );
        if (!doctor) return res.status(404).json({ status: 'error', message: 'Doctor profile not found.' });
        return res.status(200).json({ status: 'success', message: 'Your account has been deactivated.' });
    } catch (err) { next(err); }
};

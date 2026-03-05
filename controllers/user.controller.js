'use strict';
const { User } = require('../models');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ALLOWED_UPDATE = [
    'full_name', 'email', 'phone', 'dob', 'blood_group', 'phase', 'delivery_type',
    'aadhar_number', 'address', 'city', 'state', 'pincode', 'country',
    'height_cm', 'weight_kg', 'bmi',
    'haemoglobin', 'thyroid', 'vitamin_d3', 'glucose', 'ferritin', 'serum_ferritin',
    'symptoms', 'family', 'preferences', 'profile_picture_url',
    'caregiver_permissions', 'notifications'
];
const ENUM_FIELDS = ['blood_group', 'phase', 'delivery_type'];

const buildUpdate = (body) => {
    const update = {};
    for (const key of ALLOWED_UPDATE) {
        if (body[key] !== undefined) update[key] = body[key];
    }
    // Drop empty-string enum values to avoid validation errors
    for (const f of ENUM_FIELDS) {
        if (update[f] === '') delete update[f];
    }
    return update;
};

// ─── GET /api/users/me ────────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('-password_hash');
        if (!user) return res.status(404).json({ status: 'error', message: 'User not found.' });
        return res.status(200).json({ status: 'success', data: { user } });
    } catch (err) { next(err); }
};

// ─── PATCH /api/users/me ──────────────────────────────────────────────────────
exports.updateMe = async (req, res, next) => {
    try {
        const FORBIDDEN = ['password_hash', 'password', 'role', 'is_active', '_id', '__v'];
        FORBIDDEN.forEach(f => delete req.body[f]);

        const update = buildUpdate(req.body);
        if (Object.keys(update).length === 0)
            return res.status(400).json({ status: 'error', message: 'No valid fields to update.' });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: update },
            { returnDocument: 'after', runValidators: false }
        ).select('-password_hash');

        if (!user) return res.status(404).json({ status: 'error', message: 'User not found.' });
        return res.status(200).json({ status: 'success', data: { user } });
    } catch (err) { next(err); }
};

// ─── DELETE /api/users/me ─────────────────────────────────────────────────────
exports.deleteMe = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { is_active: false });
        return res.status(200).json({ status: 'success', message: 'Account deactivated successfully.' });
    } catch (err) { next(err); }
};

// ─── GET /api/users ───────────────────────── (admin only) ────────────────────
exports.getAllUsers = async (req, res, next) => {
    try {
        const { role, phase, active, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (phase) filter.phase = phase;
        if (active !== undefined) filter.is_active = active === 'true';

        const skip = (Number(page) - 1) * Number(limit);
        const [users, total] = await Promise.all([
            User.find(filter).select('-password_hash').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            User.countDocuments(filter),
        ]);

        return res.status(200).json({
            status: 'success',
            results: users.length,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            data: { users },
        });
    } catch (err) { next(err); }
};

// ─── GET /api/users/:id ───────────────────── (admin only) ────────────────────
exports.getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password_hash');
        if (!user) return res.status(404).json({ status: 'error', message: 'User not found.' });
        return res.status(200).json({ status: 'success', data: { user } });
    } catch (err) { next(err); }
};

// ─── PATCH /api/users/:id ─────────────────── (admin only) ────────────────────
exports.updateUser = async (req, res, next) => {
    try {
        const update = buildUpdate(req.body);
        // Admins may also set role and is_active
        if (req.body.role !== undefined) update.role = req.body.role;
        if (req.body.is_active !== undefined) update.is_active = req.body.is_active;

        if (Object.keys(update).length === 0)
            return res.status(400).json({ status: 'error', message: 'No valid fields to update.' });

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: update },
            { returnDocument: 'after', runValidators: false }
        ).select('-password_hash');

        if (!user) return res.status(404).json({ status: 'error', message: 'User not found.' });
        return res.status(200).json({ status: 'success', data: { user } });
    } catch (err) { next(err); }
};

// ─── DELETE /api/users/:id ────────────────── (admin only) ────────────────────
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ status: 'error', message: 'User not found.' });
        return res.status(200).json({ status: 'success', message: 'User permanently deleted.' });
    } catch (err) { next(err); }
};

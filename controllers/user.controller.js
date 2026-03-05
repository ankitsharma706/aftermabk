'use strict';

const { User, CalendarEvent } = require('../models');
const { predictCycleCalendar } = require('../services/healthScoring.service');
const { sanitizeUser, parsePagination, paginateMeta } = require('../utils/helpers');
const { createError } = require('../middleware/error.middleware');

// ─────────────────────────────────────────────────────────────
// GET ALL USERS  (admin only)
// ─────────────────────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
    try {
        const { page, limit, skip } = parsePagination(req.query); // Mongoose uses skip instead of offset
        // Helper outputs { page, limit, offset } so we map offset -> skip
        const offset = parsePagination(req.query).offset;
        const { maternity_stage, search } = req.query;

        const query = {};
        if (maternity_stage) query.maternity_stage = maternity_stage;
        if (search) {
            query.$or = [
                { full_name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const count = await User.countDocuments(query);
        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit);

        return res.status(200).json({
            status: 'success',
            data: {
                users: users.map(u => sanitizeUser(u)),
                meta: paginateMeta(count, page, limit),
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────
// GET ONE USER
// ─────────────────────────────────────────────────────────────
const getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return next(createError('User not found.', 404));

        return res.status(200).json({ status: 'success', data: { user: sanitizeUser(user) } });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────
// CREATE USER (ADMIN)
// ─────────────────────────────────────────────────────────────
const createUser = async (req, res, next) => {
    try {
        const { email, password, full_name, phone, role } = req.body;

        // This is a basic creation without all auth checks, meant for admin use
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(createError('Email already in use.', 400));
        }

        const newUser = new User({
            email,
            full_name,
            phone,
            role: role || 'user',
            // In a real scenario, you'd hash the password here if provided
            // For example: password_hash: await hashPassword(password)
        });

        await newUser.save();

        return res.status(201).json({
            status: 'success',
            message: 'User created successfully.',
            data: { user: sanitizeUser(newUser) },
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────
// UPDATE USER PROFILE
// ─────────────────────────────────────────────────────────────
const updateUser = async (req, res, next) => {
    try {
        let updateData = { ...req.body };

        // Strip protected fields for non-admins
        if (!req.user || req.user.role !== 'admin') {
            const {
                password_hash, role, provider_id, auth_provider,
                is_active, is_verified, last_login_at, _id,
                ...allowedUpdates
            } = req.body;
            updateData = allowedUpdates;
        } else {
            // Even admins shouldn't overwrite _id directly
            delete updateData._id;
        }

        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { $set: updateData },
            { returnDocument: 'after', runValidators: true }
        );

        if (!user) return next(createError('User not found.', 404));

        return res.status(200).json({
            status: 'success',
            message: 'Profile updated successfully.',
            data: { user: sanitizeUser(user) },
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────
// DELETE USER  (admin only or self-delete)
// ─────────────────────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.userId);
        if (!user) return next(createError('User not found.', 404));

        return res.status(200).json({
            status: 'success',
            message: 'User account deleted successfully.',
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────
// CHANGE USER ROLE (ADMIN ONLY)
// ─────────────────────────────────────────────────────────────
const changeUserRole = async (req, res, next) => {
    try {
        const { role } = req.body;

        if (!role || !['user', 'admin', 'doctor'].includes(role)) {
            return next(createError('A valid role is required (user, admin, doctor).', 400));
        }

        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { $set: { role } },
            { returnDocument: 'after', runValidators: true }
        );

        if (!user) return next(createError('User not found.', 404));

        return res.status(200).json({
            status: 'success',
            message: `User role successfully updated to ${role}.`,
            data: { user: sanitizeUser(user) },
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────
// GET MY CYCLE CALENDAR
// ─────────────────────────────────────────────────────────────
const getMyCycleCalendar = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return next(createError('User not found.', 404));

        const monthsAhead = parseInt(req.query.months, 10) || 3;

        // Get existing confirmed events
        const existingEvents = await CalendarEvent.find({ user_id: user._id })
            .sort({ event_date: 1 });

        // Predict future cycle events
        const predicted = predictCycleCalendar(
            user.last_period_date,
            user.cycle_length_days,
            user.period_duration_days,
            monthsAhead
        );

        return res.status(200).json({
            status: 'success',
            data: {
                confirmed_events: existingEvents,
                predicted_events: predicted,
                cycle_info: {
                    last_period_date: user.last_period_date,
                    cycle_length_days: user.cycle_length_days,
                    period_duration_days: user.period_duration_days,
                    flow_intensity: user.flow_intensity,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────
// LOG CALENDAR EVENT
// ─────────────────────────────────────────────────────────────
const logCalendarEvent = async (req, res, next) => {
    try {
        const { event_date, event_type, flow_intensity, cramps_severity, symptoms, title, description } = req.body;

        const event = await CalendarEvent.create({
            user_id: req.user._id,
            event_date,
            event_type,
            flow_intensity,
            cramps_severity,
            symptoms: symptoms || [],
            title,
            description,
            is_confirmed: true,
        });

        if (event_type === 'period_start') {
            await User.findByIdAndUpdate(req.user._id, { last_period_date: event_date });
        }

        return res.status(201).json({
            status: 'success',
            message: 'Calendar event logged.',
            data: { event },
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────
// DELETE CALENDAR EVENT
// ─────────────────────────────────────────────────────────────
const deleteCalendarEvent = async (req, res, next) => {
    try {
        const event = await CalendarEvent.findOneAndDelete({
            _id: req.params.eventId,
            user_id: req.user._id,
        });

        if (!event) return next(createError('Calendar event not found.', 404));

        return res.status(200).json({ status: 'success', message: 'Event deleted.' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    changeUserRole,
    getMyCycleCalendar,
    logCalendarEvent,
    deleteCalendarEvent,
};

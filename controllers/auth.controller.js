'use strict';
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Doctor } = require('../models');
const config = require('../config/config');

const signToken = (id) =>
    jwt.sign({ _id: id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn || '7d' });

// POST /api/auth/register
exports.register = async (req, res, next) => {
    try {
        const { full_name, email, password, phone } = req.body;

        if (!full_name || !email || !password)
            return res.status(400).json({ status: 'error', message: 'full_name, email and password are required.' });

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing)
            return res.status(409).json({ status: 'error', message: 'Email already registered.' });

        const password_hash = await bcrypt.hash(password, 12);

        // Mock data from user.json for new signups
        const mockData = {
            dob: '1997-01-15',
            blood_group: 'A+',
            phase: 'postpartum',
            delivery_type: 'c-section',
            aadhar_number: '123456789012',
            address: 'ITER, SOA University',
            city: 'Bhubaneswar',
            state: 'Odisha',
            pincode: '751030',
            country: 'India',
            height_cm: 160,
            weight_kg: 60,
            bmi: 23.4,
            haemoglobin: 10.5,
            thyroid: 2.8,
            vitamin_d3: 18,
            glucose: 92,
            ferritin: 11,
            serum_ferritin: 12,
            symptoms: ['fatigue', 'back_pain', 'dizziness'],
            family: {
                contact_name: 'Rohit Sharma',
                contact_phone: '+91-9123456789',
                relation: 'Husband'
            },
            preferences: {
                language: 'Hindi',
                reminder_time: '08:00'
            }
        };

        const user = await User.create({ full_name, email, phone, password_hash, ...mockData });

        const token = signToken(user._id);
        const safeUser = user.toObject();
        delete safeUser.password_hash;

        return res.status(201).json({
            status: 'success',
            data: { token, user: safeUser },
        });
    } catch (err) { next(err); }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ status: 'error', message: 'Email and password are required.' });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !(await user.comparePassword(password)))
            return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });

        if (!user.is_active)
            return res.status(401).json({ status: 'error', message: 'Account deactivated. Contact support.' });

        const token = signToken(user._id);
        const safeUser = user.toObject();
        delete safeUser.password_hash;

        return res.status(200).json({
            status: 'success',
            data: { token, user: safeUser },
        });
    } catch (err) { next(err); }
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
    try {
        if (req.user.role === 'doctor') {
            const doctor = await Doctor.findById(req.user._id).select('-password_hash');
            if (!doctor) return res.status(404).json({ status: 'error', message: 'Doctor not found.' });
            return res.status(200).json({ status: 'success', data: { doctor } });
        }

        const user = await User.findById(req.user._id).select('-password_hash');
        if (!user) return res.status(404).json({ status: 'error', message: 'User not found.' });
        return res.status(200).json({ status: 'success', data: { user } });
    } catch (err) { next(err); }
};

// POST /api/auth/google
// Accepts a Google ID token (credential), decodes it, and finds/creates the user.
exports.loginWithGoogle = async (req, res, next) => {
    try {
        const { credential } = req.body;
        if (!credential) return res.status(400).json({ status: 'error', message: 'Google credential is required.' });

        // Decode the Google JWT payload (it is NOT verified here — for production use google-auth-library)
        const parts = credential.split('.');
        if (parts.length !== 3) return res.status(400).json({ status: 'error', message: 'Invalid Google credential.' });

        const payloadStr = Buffer.from(parts[1], 'base64url').toString('utf8');
        const payload = JSON.parse(payloadStr);

        const { email, name, sub: googleId } = payload;
        if (!email) return res.status(400).json({ status: 'error', message: 'Google credential missing email.' });

        // Find existing user or create one
        let user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            // New user via Google — create with a random password hash
            const password_hash = await bcrypt.hash(googleId + Date.now(), 12);

            // Mock data from user.json for new signups
            const mockData = {
                dob: '1997-01-15',
                blood_group: 'A+',
                phase: 'postpartum',
                delivery_type: 'c-section',
                aadhar_number: '123456789012',
                address: 'ITER, SOA University',
                city: 'Bhubaneswar',
                state: 'Odisha',
                pincode: '751030',
                country: 'India',
                height_cm: 160,
                weight_kg: 60,
                bmi: 23.4,
                haemoglobin: 10.5,
                thyroid: 2.8,
                vitamin_d3: 18,
                glucose: 92,
                ferritin: 11,
                serum_ferritin: 12,
                symptoms: ['fatigue', 'back_pain', 'dizziness'],
                family: {
                    contact_name: 'Rohit Sharma',
                    contact_phone: '+91-9123456789',
                    relation: 'Husband'
                },
                preferences: {
                    language: 'Hindi',
                    reminder_time: '08:00'
                }
            };

            user = await User.create({
                full_name: name || email.split('@')[0],
                email: email.toLowerCase(),
                password_hash,
                role: 'user',
                ...mockData
            });
        }

        if (!user.is_active) return res.status(401).json({ status: 'error', message: 'Account deactivated.' });

        const token = signToken(user._id);
        const safeUser = user.toObject();
        delete safeUser.password_hash;

        return res.status(200).json({
            status: 'success',
            data: { token, user: safeUser },
        });
    } catch (err) { next(err); }
};


// ──────────────────────────────────────────────────────────────────────────────
//  DOCTOR AUTH
// ──────────────────────────────────────────────────────────────────────────────

const signDoctorToken = (id) =>
    jwt.sign({ _id: id, role: 'doctor' }, config.jwt.secret, { expiresIn: config.jwt.expiresIn || '7d' });

// POST /api/auth/doctor/register
exports.doctorRegister = async (req, res, next) => {
    try {
        const { name, email, password, specialization, phone, registration_number } = req.body;

        if (!name || !email || !password || !specialization)
            return res.status(400).json({ status: 'error', message: 'name, email, password and specialization are required.' });

        const existing = await Doctor.findOne({ email: email.toLowerCase() });
        if (existing)
            return res.status(409).json({ status: 'error', message: 'A doctor with this email already exists.' });

        const password_hash = await bcrypt.hash(password, 12);
        const doctor = await Doctor.create({ name, email, specialization, phone, registration_number, password_hash });

        const token = signDoctorToken(doctor._id);
        const safeDoctor = doctor.toObject();
        delete safeDoctor.password_hash;

        return res.status(201).json({
            status: 'success',
            data: { token, doctor: safeDoctor },
        });
    } catch (err) { next(err); }
};

// POST /api/auth/doctor/login
exports.doctorLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ status: 'error', message: 'Email and password are required.' });

        // Explicitly select password_hash (it is hidden by default via select:false)
        const doctor = await Doctor.findOne({ email: email.toLowerCase() }).select('+password_hash');
        if (!doctor || !(await doctor.comparePassword(password)))
            return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });

        if (!doctor.active)
            return res.status(401).json({ status: 'error', message: 'Account deactivated. Contact support.' });

        const token = signDoctorToken(doctor._id);
        const safeDoctor = doctor.toObject();
        delete safeDoctor.password_hash;

        return res.status(200).json({
            status: 'success',
            data: { token, doctor: safeDoctor },
        });
    } catch (err) { next(err); }
};

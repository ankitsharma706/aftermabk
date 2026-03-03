'use strict';

const bcrypt = require('bcryptjs');
const { User } = require('../models');
const config = require('../config/config');
const { generateToken, generateRefreshToken, verifyRefreshToken, sanitizeUser } = require('../utils/helpers');
const { createError } = require('../middleware/error.middleware');

// Twilio Setup
let twilioClient;
if (config.twilio.accountSid && config.twilio.authToken) {
    twilioClient = require('twilio')(config.twilio.accountSid, config.twilio.authToken);
}

// ─────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
    try {
        const { email, password, full_name, maternity_stage, delivery_method, dob, phone } = req.body;

        // Check duplicate email
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return next(createError('An account with this email already exists.', 409));
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, config.security.bcryptRounds);

        const user = await User.create({
            email: email.toLowerCase(),
            password_hash,
            full_name,
            phone,
            maternity_stage: maternity_stage || 'Postpartum',
            delivery_method: delivery_method || 'Unknown',
            dob,
            auth_provider: 'local',
        });

        const token = generateToken({ _id: user._id, email: user.email, role: user.role });
        const refreshToken = generateRefreshToken({ _id: user._id });

        return res.status(201).json({
            status: 'success',
            message: 'Account created successfully.',
            data: {
                user: sanitizeUser(user),
                token,
                refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() }).select('+password_hash');

        if (!user || !user.password_hash) {
            return next(createError('Invalid email or password.', 401));
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return next(createError('Invalid email or password.', 401));
        }

        if (!user.is_active) {
            return next(createError('Your account has been deactivated.', 401));
        }

        // Update last login
        user.last_login_at = new Date();
        await user.save();

        const token = generateToken({ _id: user._id, email: user.email, role: user.role });
        const refreshToken = generateRefreshToken({ _id: user._id });

        return res.status(200).json({
            status: 'success',
            message: 'Login successful.',
            data: {
                user: sanitizeUser(user),
                token,
                refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken: token } = req.body;
        if (!token) return next(createError('Refresh token required.', 400));

        let decoded;
        try {
            decoded = verifyRefreshToken(token);
        } catch {
            return next(createError('Invalid or expired refresh token.', 401));
        }

        const user = await User.findById(decoded._id).select('_id email role is_active');

        if (!user || !user.is_active) {
            return next(createError('User not found or deactivated.', 401));
        }

        const newToken = generateToken({ _id: user._id, email: user.email, role: user.role });

        return res.status(200).json({
            status: 'success',
            data: { token: newToken },
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────
// GOOGLE AUTH CALLBACK
// ─────────────────────────────────────────────────────────────
const googleCallback = async (req, res, next) => {
    try {
        const { googleId, email, name, picture } = req.googleUser;

        let user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            user = await User.create({
                email: email.toLowerCase(),
                full_name: name,
                profile_picture_url: picture,
                auth_provider: 'google',
                provider_id: googleId,
                is_verified: true,
            });
        } else {
            user.auth_provider = 'google';
            user.provider_id = googleId;
            user.profile_picture_url = user.profile_picture_url || picture;
            user.is_verified = true;
            user.last_login_at = new Date();
            await user.save();
        }

        const token = generateToken({ _id: user._id, email: user.email, role: user.role });
        const refresh = generateRefreshToken({ _id: user._id });

        return res.status(200).json({
            status: 'success',
            message: 'Google authentication successful.',
            data: {
                user: sanitizeUser(user),
                token,
                refreshToken: refresh,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────
// VERIFY GOOGLE ID TOKEN
// ─────────────────────────────────────────────────────────────
const verifyGoogleToken = async (req, res, next) => {
    try {
        const { id_token } = req.body;
        if (!id_token) return next(createError('Google id_token required.', 400));

        const parts = id_token.split('.');
        if (parts.length !== 3) return next(createError('Invalid Google token.', 400));

        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));

        req.googleUser = {
            googleId: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
        };

        return googleCallback(req, res, next);
    } catch (error) {
        next(createError('Failed to verify Google token.', 401));
    }
};

// ─────────────────────────────────────────────────────────────
// APPLE AUTH
// ─────────────────────────────────────────────────────────────
const appleCallback = async (req, res, next) => {
    try {
        const { identity_token, user: appleUserData } = req.body;
        if (!identity_token) return next(createError('Apple identity_token required.', 400));

        const parts = identity_token.split('.');
        if (parts.length !== 3) return next(createError('Invalid Apple token.', 400));

        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));

        const appleId = payload.sub;
        const email = payload.email || appleUserData?.email;
        const name = appleUserData?.name
            ? `${appleUserData.name.firstName || ''} ${appleUserData.name.lastName || ''}`.trim()
            : email?.split('@')[0];

        if (!email) return next(createError('Email not provided by Apple.', 400));

        let user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            user = await User.create({
                email: email.toLowerCase(),
                full_name: name || 'Apple User',
                auth_provider: 'apple',
                provider_id: appleId,
                is_verified: true,
            });
        } else {
            user.auth_provider = 'apple';
            user.provider_id = appleId;
            user.is_verified = true;
            user.last_login_at = new Date();
            await user.save();
        }

        const token = generateToken({ _id: user._id, email: user.email, role: user.role });
        const refresh = generateRefreshToken({ _id: user._id });

        return res.status(200).json({
            status: 'success',
            message: 'Apple authentication successful.',
            data: {
                user: sanitizeUser(user),
                token,
                refreshToken: refresh,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────
// TWILIO SEND OTP
// ─────────────────────────────────────────────────────────────
const sendOtp = async (req, res, next) => {
    try {
        if (!twilioClient) {
            return next(createError('Twilio is not configured on the server.', 500));
        }

        const { phone } = req.body;

        const verification = await twilioClient.verify.v2
            .services(config.twilio.verifyServiceSid)
            .verifications
            .create({ to: phone, channel: 'sms' });

        return res.status(200).json({
            status: 'success',
            message: `OTP sent successfully. Status: ${verification.status}`,
        });
    } catch (error) {
        next(createError(error.message || 'Failed to send OTP. Please check the phone number.', 400));
    }
};

// ─────────────────────────────────────────────────────────────
// TWILIO VERIFY OTP (Sign In / Sign Up)
// ─────────────────────────────────────────────────────────────
const verifyOtp = async (req, res, next) => {
    try {
        if (!twilioClient) {
            return next(createError('Twilio is not configured on the server.', 500));
        }

        const { phone, code } = req.body;

        const verification_check = await twilioClient.verify.v2
            .services(config.twilio.verifyServiceSid)
            .verificationChecks
            .create({ to: phone, code: code });

        if (verification_check.status !== 'approved') {
            return next(createError('Invalid or expired OTP.', 401));
        }

        // OTP Approved. Login or Register the user.
        let user = await User.findOne({ phone: phone });

        if (!user) {
            // Register new user with just the phone number
            user = await User.create({
                phone: phone,
                auth_provider: 'twilio',
                is_verified: true,
                full_name: 'Twilio User', // default name
            });
        } else {
            // Login existing user
            user.is_verified = true;
            user.last_login_at = new Date();
            await user.save();
        }

        const token = generateToken({ _id: user._id, phone: user.phone, role: user.role });
        const refreshToken = generateRefreshToken({ _id: user._id });

        return res.status(200).json({
            status: 'success',
            message: 'Phone verification successful.',
            data: {
                user: sanitizeUser(user),
                token,
                refreshToken,
            },
        });
    } catch (error) {
        next(createError(error.message || 'Failed to verify OTP.', 400));
    }
};

// ─────────────────────────────────────────────────────────────
// GET ME
// ─────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return next(createError('User not found.', 404));

        return res.status(200).json({
            status: 'success',
            data: { user: sanitizeUser(user) },
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────────────────────────
const changePassword = async (req, res, next) => {
    try {
        const { current_password, new_password } = req.body;

        const user = await User.findById(req.user._id).select('+password_hash');
        if (!user) return next(createError('User not found.', 404));

        if (user.auth_provider !== 'local') {
            return next(createError('Password change is not available for OAuth accounts.', 400));
        }

        const isMatch = await bcrypt.compare(current_password, user.password_hash);
        if (!isMatch) return next(createError('Current password is incorrect.', 400));

        user.password_hash = await bcrypt.hash(new_password, config.security.bcryptRounds);
        await user.save();

        return res.status(200).json({
            status: 'success',
            message: 'Password changed successfully.',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    refreshToken,
    googleCallback,
    verifyGoogleToken,
    appleCallback,
    sendOtp,
    verifyOtp,
    getMe,
    changePassword,
};

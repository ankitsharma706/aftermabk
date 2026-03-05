'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { User, Doctor } = require('../models');

/**
 * Verify JWT token from Authorization header.
 * Supports both User tokens (role: 'user'|'admin') and Doctor tokens (role: 'doctor').
 * Attaches req.user = { _id, email, role }
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please provide a valid token.',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Token has expired. Please log in again.',
        });
      }
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. Please log in again.',
      });
    }

    // ── Doctor token ─────────────────────────────────────────────────
    if (decoded.role === 'doctor') {
      const doctor = await Doctor.findById(decoded._id).select('_id email active');
      if (!doctor) {
        return res.status(401).json({
          status: 'error',
          message: 'The doctor belonging to this token no longer exists.',
        });
      }
      if (!doctor.active) {
        return res.status(401).json({
          status: 'error',
          message: 'Your doctor account has been deactivated. Please contact support.',
        });
      }
      req.user = { _id: doctor._id, email: doctor.email, role: 'doctor' };
      return next();
    }

    // ── User / Admin token ──────────────────────────────────────────
    const user = await User.findById(decoded._id).select('_id email role is_active');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    req.user = {
      _id: user._id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Restrict access to specific roles.
 * Usage: restrictTo('admin', 'doctor')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
};

/**
 * Verify that the authenticated user owns the resource.
 * Compares req.user._id with req.params.userId
 */
const ownResource = (req, res, next) => {
  const paramUserId = req.params.userId || req.params.user_id;

  if (req.user.role === 'admin') {
    return next(); // admins can access any resource
  }

  if (paramUserId && req.user._id.toString() !== paramUserId.toString()) {
    return res.status(403).json({
      status: 'error',
      message: 'You do not have permission to access this resource.',
    });
  }

  next();
};

module.exports = { protect, restrictTo, ownResource };

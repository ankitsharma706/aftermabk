'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Generate a signed JWT token for a user.
 */
const generateToken = (payload, expiresIn = config.jwt.expiresIn) => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
};

/**
 * Generate a refresh token.
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

/**
 * Verify a refresh token.
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};

/**
 * Build a sanitized user response (never expose password_hash).
 */
const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password_hash;
  return obj;
};

/**
 * Build paginated response metadata.
 */
const paginateMeta = (count, page, limit) => ({
  total: count,
  page: parseInt(page, 10),
  limit: parseInt(limit, 10),
  pages: Math.ceil(count / limit),
});

/**
 * Parse pagination from query params with safe defaults.
 */
const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  sanitizeUser,
  paginateMeta,
  parsePagination,
};

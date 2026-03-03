'use strict';

const { validationResult } = require('express-validator');

/**
 * Middleware to process express-validator results.
 * Attach after validation chains in routes.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
        value: e.value,
      })),
    });
  }
  next();
};

module.exports = { validate };

'use strict';
const router = require('express').Router();
const { Medicine } = require('../models');

router.get('/', async (req, res, next) => {
  try {
    const medicines = await Medicine.find({ is_active: true }).sort({ name: 1 });
    return res.status(200).json({ status: 'success', results: medicines.length, data: { medicines } });
  } catch (err) { next(err); }
});

module.exports = router;

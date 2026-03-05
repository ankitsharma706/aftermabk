'use strict';
const router = require('express').Router();
const { InsurancePlan } = require('../models');

router.get('/', async (req, res, next) => {
  try {
    const plans = await InsurancePlan.find({ active: true }).sort({ scheme_name: 1 });
    return res.status(200).json({ status: 'success', results: plans.length, data: { plans } });
  } catch (err) { next(err); }
});

module.exports = router;

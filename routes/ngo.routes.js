'use strict';
const router = require('express').Router();
const { Ngo } = require('../models');

router.get('/', async (req, res, next) => {
  try {
    const ngos = await Ngo.find({ active_support: true }).sort({ rating: -1 });
    return res.status(200).json({ status: 'success', results: ngos.length, data: { ngos } });
  } catch (err) { next(err); }
});

module.exports = router;

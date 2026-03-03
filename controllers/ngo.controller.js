'use strict';

const { Ngo } = require('../models');
const { parsePagination, paginateMeta } = require('../utils/helpers');
const { createError } = require('../middleware/error.middleware');

const createNgo = async (req, res, next) => {
  try {
    const ngo = await Ngo.create(req.body);
    return res.status(201).json({ status: 'success', data: { ngo } });
  } catch (error) { next(error); }
};

const getAllNgos = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { location, search, active_support } = req.query;

    const query = {};
    if (location) query.location = { $regex: location, $options: 'i' };
    if (active_support !== undefined) query.active_support = active_support === 'true';
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { awareness_info: { $regex: search, $options: 'i' } },
      ];
    }

    const count = await Ngo.countDocuments(query);
    const ngos = await Ngo.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    return res.status(200).json({
      status: 'success',
      data: { ngos, meta: paginateMeta(count, page, limit) },
    });
  } catch (error) { next(error); }
};

const getNgoById = async (req, res, next) => {
  try {
    const ngo = await Ngo.findById(req.params.ngoId);
    if (!ngo) return next(createError('NGO not found.', 404));
    return res.status(200).json({ status: 'success', data: { ngo } });
  } catch (error) { next(error); }
};

const updateNgo = async (req, res, next) => {
  try {
    const ngo = await Ngo.findByIdAndUpdate(
      req.params.ngoId,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!ngo) return next(createError('NGO not found.', 404));
    return res.status(200).json({ status: 'success', data: { ngo } });
  } catch (error) { next(error); }
};

const deleteNgo = async (req, res, next) => {
  try {
    const ngo = await Ngo.findByIdAndDelete(req.params.ngoId);
    if (!ngo) return next(createError('NGO not found.', 404));
    return res.status(200).json({ status: 'success', message: 'NGO deleted.' });
  } catch (error) { next(error); }
};

module.exports = { createNgo, getAllNgos, getNgoById, updateNgo, deleteNgo };

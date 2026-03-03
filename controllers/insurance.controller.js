'use strict';

const { InsurancePlan } = require('../models');
const { parsePagination, paginateMeta } = require('../utils/helpers');
const { createError } = require('../middleware/error.middleware');

const createInsurancePlan = async (req, res, next) => {
  try {
    const plan = await InsurancePlan.create(req.body);
    return res.status(201).json({ status: 'success', data: { plan } });
  } catch (error) { next(error); }
};

const getAllInsurancePlans = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { bank_name, coverage_min, coverage_max, active, search } = req.query;

    const query = {};
    if (bank_name) query.bank_name = { $regex: bank_name, $options: 'i' };
    if (active !== undefined) query.active = active === 'true';
    if (coverage_min) query.coverage_max = { $gte: parseInt(coverage_min, 10) };
    if (coverage_max) query.coverage_min = { $lte: parseInt(coverage_max, 10) };
    if (search) {
      query.$or = [
        { bank_name: { $regex: search, $options: 'i' } },
        { scheme_name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const count = await InsurancePlan.countDocuments(query);
    const plans = await InsurancePlan.find(query)
      .sort({ approval_rate: -1, coverage_max: -1 })
      .skip(offset)
      .limit(limit);

    return res.status(200).json({
      status: 'success',
      data: { plans, meta: paginateMeta(count, page, limit) },
    });
  } catch (error) { next(error); }
};

const getInsurancePlanById = async (req, res, next) => {
  try {
    const plan = await InsurancePlan.findById(req.params.planId);
    if (!plan) return next(createError('Insurance plan not found.', 404));
    return res.status(200).json({ status: 'success', data: { plan } });
  } catch (error) { next(error); }
};

const updateInsurancePlan = async (req, res, next) => {
  try {
    const plan = await InsurancePlan.findByIdAndUpdate(
      req.params.planId,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!plan) return next(createError('Insurance plan not found.', 404));
    return res.status(200).json({ status: 'success', data: { plan } });
  } catch (error) { next(error); }
};

const deleteInsurancePlan = async (req, res, next) => {
  try {
    const plan = await InsurancePlan.findByIdAndDelete(req.params.planId);
    if (!plan) return next(createError('Insurance plan not found.', 404));
    return res.status(200).json({ status: 'success', message: 'Insurance plan deleted.' });
  } catch (error) { next(error); }
};

module.exports = {
  createInsurancePlan,
  getAllInsurancePlans,
  getInsurancePlanById,
  updateInsurancePlan,
  deleteInsurancePlan,
};

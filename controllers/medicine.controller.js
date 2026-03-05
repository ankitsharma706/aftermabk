'use strict';

const Medicine = require('../models/medicine.model');
const { parsePagination, paginateMeta } = require('../utils/helpers');
const { createError } = require('../middleware/error.middleware');

// ─── CREATE MEDICINE (admin) ───────────────────────────────────────────────────
const createMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.create(req.body);
    return res.status(201).json({ status: 'success', data: { medicine } });
  } catch (error) { next(error); }
};

// ─── GET ALL MEDICINES ─────────────────────────────────────────────────────────
const getAllMedicines = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { category, search } = req.query;

    const query = { is_active: true };
    if (category) query.category = { $regex: category, $options: 'i' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { purpose: { $regex: search, $options: 'i' } },
      ];
    }

    const count = await Medicine.countDocuments(query);
    const medicines = await Medicine.find(query)
      .sort({ category: 1, name: 1 })
      .skip(offset)
      .limit(limit);

    return res.status(200).json({
      status: 'success',
      data: { medicines, meta: paginateMeta(count, page, limit) },
    });
  } catch (error) { next(error); }
};

// ─── GET MEDICINE BY ID ────────────────────────────────────────────────────────
const getMedicineById = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.medicineId);
    if (!medicine) return next(createError('Medicine not found.', 404));
    return res.status(200).json({ status: 'success', data: { medicine } });
  } catch (error) { next(error); }
};

// ─── UPDATE MEDICINE (admin) ───────────────────────────────────────────────────
const updateMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.medicineId,
      { $set: req.body },
      { returnDocument: 'after', runValidators: true }
    );
    if (!medicine) return next(createError('Medicine not found.', 404));
    return res.status(200).json({ status: 'success', data: { medicine } });
  } catch (error) { next(error); }
};

// ─── DELETE MEDICINE (admin) ───────────────────────────────────────────────────
const deleteMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.medicineId);
    if (!medicine) return next(createError('Medicine not found.', 404));
    return res.status(200).json({ status: 'success', message: 'Medicine deleted.' });
  } catch (error) { next(error); }
};

module.exports = {
  createMedicine,
  getAllMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
};

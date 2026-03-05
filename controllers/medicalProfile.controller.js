'use strict';

const MedicalProfile = require('../models/medicalProfile.model');
const { createError } = require('../middleware/error.middleware');

// ─── CREATE MEDICAL PROFILE ────────────────────────────────────────────────────
const createMedicalProfile = async (req, res, next) => {
  try {
    const existing = await MedicalProfile.findOne({ user_id: req.user._id });
    if (existing) {
      return next(createError('Medical profile already exists. Use PATCH to update.', 400));
    }

    const profile = await MedicalProfile.create({
      user_id: req.user._id,
      ...req.body,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Medical profile created.',
      data: { profile },
    });
  } catch (error) { next(error); }
};

// ─── GET MY MEDICAL PROFILE ────────────────────────────────────────────────────
const getMyMedicalProfile = async (req, res, next) => {
  try {
    const profile = await MedicalProfile.findOne({ user_id: req.user._id })
      .populate('assigned_doctor_id', 'name specialization hospital session_fee rating');

    if (!profile) return next(createError('No medical profile found. Please create one.', 404));
    return res.status(200).json({ status: 'success', data: { profile } });
  } catch (error) { next(error); }
};

// ─── GET MEDICAL PROFILE BY USER ID (admin / doctor) ──────────────────────────
const getMedicalProfileByUserId = async (req, res, next) => {
  try {
    const profile = await MedicalProfile.findOne({ user_id: req.params.userId })
      .populate('assigned_doctor_id', 'name specialization hospital session_fee rating');

    if (!profile) return next(createError('Medical profile not found for this user.', 404));
    return res.status(200).json({ status: 'success', data: { profile } });
  } catch (error) { next(error); }
};

// ─── UPDATE MY MEDICAL PROFILE ─────────────────────────────────────────────────
const updateMyMedicalProfile = async (req, res, next) => {
  try {
    const { user_id, _id, ...allowedUpdates } = req.body;

    const profile = await MedicalProfile.findOneAndUpdate(
      { user_id: req.user._id },
      { $set: allowedUpdates },
      { returnDocument: 'after', runValidators: true, upsert: true }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Medical profile updated.',
      data: { profile },
    });
  } catch (error) { next(error); }
};

// ─── UPDATE LAB VALUES (for doctors to fill) ───────────────────────────────────
const updateLabValues = async (req, res, next) => {
  try {
    const {
      haemoglobin_level, thyroid_level, vitamin_d3_level,
      glucose_level, ferritin_level, serum_ferritin_level,
      lab_risk_assessment,
    } = req.body;

    const profile = await MedicalProfile.findOneAndUpdate(
      { user_id: req.params.userId },
      {
        $set: {
          haemoglobin_level,
          thyroid_level,
          vitamin_d3_level,
          glucose_level,
          ferritin_level,
          serum_ferritin_level,
          lab_risk_assessment,
        },
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!profile) return next(createError('Medical profile not found.', 404));
    return res.status(200).json({
      status: 'success',
      message: 'Lab values updated.',
      data: { profile },
    });
  } catch (error) { next(error); }
};

// ─── DELETE MEDICAL PROFILE ────────────────────────────────────────────────────
const deleteMedicalProfile = async (req, res, next) => {
  try {
    const profile = await MedicalProfile.findOneAndDelete({ user_id: req.user._id });
    if (!profile) return next(createError('Medical profile not found.', 404));
    return res.status(200).json({ status: 'success', message: 'Medical profile deleted.' });
  } catch (error) { next(error); }
};

module.exports = {
  createMedicalProfile,
  getMyMedicalProfile,
  getMedicalProfileByUserId,
  updateMyMedicalProfile,
  updateLabValues,
  deleteMedicalProfile,
};

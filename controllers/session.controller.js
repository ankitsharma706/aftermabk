'use strict';

const Session = require('../models/session.model');
const { parsePagination, paginateMeta } = require('../utils/helpers');
const { createError } = require('../middleware/error.middleware');

// ─── CREATE SESSION ────────────────────────────────────────────────────────────
const createSession = async (req, res, next) => {
  try {
    const { user_id, doctor_id, session_date, session_time, session_type, session_fee, session_currency, meeting_link } = req.body;

    const session = await Session.create({
      user_id,
      doctor_id,
      session_date,
      session_time,
      session_type,
      session_fee,
      session_currency,
      meeting_link,
      session_status: 'upcoming',
    });

    return res.status(201).json({
      status: 'success',
      message: 'Session booked successfully.',
      data: { session },
    });
  } catch (error) { next(error); }
};

// ─── GET ALL SESSIONS (admin) ──────────────────────────────────────────────────
const getAllSessions = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { session_status, user_id, doctor_id } = req.query;

    const query = {};
    if (session_status) query.session_status = session_status;
    if (user_id) query.user_id = user_id;
    if (doctor_id) query.doctor_id = doctor_id;

    const count = await Session.countDocuments(query);
    const sessions = await Session.find(query)
      .populate('user_id', 'full_name email')
      .populate('doctor_id', 'name specialization')
      .sort({ session_date: 1 })
      .skip(offset)
      .limit(limit);

    return res.status(200).json({
      status: 'success',
      data: { sessions, meta: paginateMeta(count, page, limit) },
    });
  } catch (error) { next(error); }
};

// ─── GET MY SESSIONS (user) ────────────────────────────────────────────────────
const getMySessions = async (req, res, next) => {
  try {
    const { session_status } = req.query;
    const query = { user_id: req.user._id };
    if (session_status) query.session_status = session_status;

    const sessions = await Session.find(query)
      .populate('doctor_id', 'name specialization profile_picture_url session_fee rating')
      .sort({ session_date: 1 });

    return res.status(200).json({
      status: 'success',
      data: { sessions, total: sessions.length },
    });
  } catch (error) { next(error); }
};

// ─── GET DOCTOR'S SESSIONS ─────────────────────────────────────────────────────
const getDoctorSessions = async (req, res, next) => {
  try {
    const { session_status } = req.query;
    const query = { doctor_id: req.params.doctorId };
    if (session_status) query.session_status = session_status;

    const sessions = await Session.find(query)
      .populate('user_id', 'full_name email phone profile_picture_url maternity_stage')
      .sort({ session_date: 1 });

    return res.status(200).json({
      status: 'success',
      data: { sessions, total: sessions.length },
    });
  } catch (error) { next(error); }
};

// ─── GET SESSION BY ID ─────────────────────────────────────────────────────────
const getSessionById = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.sessionId)
      .populate('user_id', 'full_name email phone')
      .populate('doctor_id', 'name specialization session_fee');

    if (!session) return next(createError('Session not found.', 404));
    return res.status(200).json({ status: 'success', data: { session } });
  } catch (error) { next(error); }
};

// ─── UPDATE SESSION ────────────────────────────────────────────────────────────
const updateSession = async (req, res, next) => {
  try {
    const { _id, user_id, ...allowedUpdates } = req.body;

    const session = await Session.findByIdAndUpdate(
      req.params.sessionId,
      { $set: allowedUpdates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!session) return next(createError('Session not found.', 404));
    return res.status(200).json({
      status: 'success',
      message: 'Session updated successfully.',
      data: { session },
    });
  } catch (error) { next(error); }
};

// ─── CANCEL SESSION ────────────────────────────────────────────────────────────
const cancelSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return next(createError('Session not found.', 404));

    if (session.session_status === 'completed') {
      return next(createError('Cannot cancel a completed session.', 400));
    }

    session.session_status = 'cancelled';
    session.cancelled_reason = req.body.reason || 'Cancelled by user.';
    await session.save();

    return res.status(200).json({
      status: 'success',
      message: 'Session cancelled successfully.',
      data: { session },
    });
  } catch (error) { next(error); }
};

// ─── DELETE SESSION (admin) ────────────────────────────────────────────────────
const deleteSession = async (req, res, next) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.sessionId);
    if (!session) return next(createError('Session not found.', 404));
    return res.status(200).json({ status: 'success', message: 'Session deleted.' });
  } catch (error) { next(error); }
};

module.exports = {
  createSession,
  getAllSessions,
  getMySessions,
  getDoctorSessions,
  getSessionById,
  updateSession,
  cancelSession,
  deleteSession,
};

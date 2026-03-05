'use strict';
const { Session, Doctor } = require('../models');

// POST /api/sessions  — book a session
exports.book = async (req, res, next) => {
  try {
    const { doctor_id, session_date, session_time, session_type, session_fee, notes } = req.body;

    if (!doctor_id || !session_date || !session_time)
      return res.status(400).json({ status: 'error', message: 'doctor_id, session_date and session_time are required.' });

    const doctor = await Doctor.findById(doctor_id);
    if (!doctor) return res.status(404).json({ status: 'error', message: 'Doctor not found.' });
    if (!doctor.available_for_booking) return res.status(400).json({ status: 'error', message: 'Doctor not available for booking.' });

    const fee = session_fee ?? doctor.session_fee;

    const session = await Session.create({
      user_id: req.user._id,
      doctor_id,
      session_date: new Date(session_date),
      session_time,
      session_type: session_type || 'video',
      session_fee: fee,
      session_currency: 'INR',
      notes,
    });

    await session.populate('doctor_id', 'name specialization designation session_fee rating');
    return res.status(201).json({ status: 'success', data: { session } });
  } catch (err) { next(err); }
};

// GET /api/sessions/me
exports.getMySessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ user_id: req.user._id })
      .populate('doctor_id', 'name specialization designation profile_picture_url')
      .sort({ session_date: -1 });
    return res.status(200).json({ status: 'success', results: sessions.length, data: { sessions } });
  } catch (err) { next(err); }
};

// PATCH /api/sessions/:id/cancel
exports.cancel = async (req, res, next) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, user_id: req.user._id });
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found.' });
    if (session.session_status === 'cancelled')
      return res.status(400).json({ status: 'error', message: 'Session already cancelled.' });

    session.session_status = 'cancelled';
    session.cancelled_reason = req.body.reason || '';
    await session.save();

    return res.status(200).json({ status: 'success', data: { session } });
  } catch (err) { next(err); }
};

// GET /api/sessions (admin)
exports.getAll = async (req, res, next) => {
  try {
    const sessions = await Session.find()
      .populate('user_id', 'full_name email')
      .populate('doctor_id', 'name specialization')
      .sort({ session_date: -1 });
    return res.status(200).json({ status: 'success', results: sessions.length, data: { sessions } });
  } catch (err) { next(err); }
};

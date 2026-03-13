'use strict';
const { Question, User, Doctor } = require('../models');

// Helper to get display name for a user
const getDisplayName = async (user) => {
  if (user.role === 'doctor') {
    const doc = await Doctor.findById(user._id).select('name').lean();
    return doc?.name || user.email;
  }
  const u = await User.findById(user._id).select('full_name').lean();
  return u?.full_name || user.email;
};

// GET /api/questions — list all questions (with optional filters)
exports.getAll = async (req, res, next) => {
  try {
    const { category, search, sort = '-createdAt', limit = 50, page = 1 } = req.query;

    const filter = {};
    if (category && category !== 'All') filter.category = category;
    if (search) filter.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-answers')                // don't send full answers in list view
        .lean({ virtuals: true }),
      Question.countDocuments(filter),
    ]);

    // Manually add answersCount for lean docs since virtuals don't hydrate
    const enriched = await Promise.all(
      questions.map(async (q) => {
        const doc = await Question.findById(q._id).select('answers');
        return { ...q, answersCount: doc?.answers?.length || 0 };
      })
    );

    return res.status(200).json({
      status: 'success',
      results: enriched.length,
      total,
      data: { questions: enriched },
    });
  } catch (err) { next(err); }
};

// GET /api/questions/:id — single question with answers
exports.getById = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!question) {
      return res.status(404).json({ status: 'error', message: 'Question not found.' });
    }
    return res.status(200).json({ status: 'success', data: { question } });
  } catch (err) { next(err); }
};

// POST /api/questions — create a question (auth required)
exports.create = async (req, res, next) => {
  try {
    const { title, description, category, tags } = req.body;

    if (!title || !description) {
      return res.status(400).json({ status: 'error', message: 'Title and description are required.' });
    }

    const displayName = await getDisplayName(req.user);

    const question = await Question.create({
      title,
      description,
      category: category || 'General',
      author: displayName,
      author_id: req.user._id,
      tags: Array.isArray(tags) ? tags.map(t => t.trim().toUpperCase()) : [],
    });

    return res.status(201).json({ status: 'success', data: { question } });
  } catch (err) { next(err); }
};

// POST /api/questions/:id/answer — post an answer (auth required)
exports.addAnswer = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ status: 'error', message: 'Answer text is required.' });
    }

    const displayName = await getDisplayName(req.user);

    const question = await Question.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          answers: {
            user: displayName,
            user_id: req.user._id,
            text: text.trim(),
            is_doctor_verified: req.user.role === 'doctor',
          },
        },
      },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({ status: 'error', message: 'Question not found.' });
    }

    return res.status(201).json({ status: 'success', data: { question } });
  } catch (err) { next(err); }
};

// PATCH /api/questions/:id/upvote — upvote a question (auth required)
exports.upvote = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { $inc: { upvotes: 1 } },
      { new: true }
    );
    if (!question) {
      return res.status(404).json({ status: 'error', message: 'Question not found.' });
    }
    return res.status(200).json({ status: 'success', data: { question } });
  } catch (err) { next(err); }
};

// DELETE /api/questions/:id — delete a question (auth required, owner only)
exports.remove = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ status: 'error', message: 'Question not found.' });
    }
    if (question.author_id?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'You can only delete your own questions.' });
    }
    await Question.findByIdAndDelete(req.params.id);
    return res.status(200).json({ status: 'success', message: 'Question deleted.' });
  } catch (err) { next(err); }
};

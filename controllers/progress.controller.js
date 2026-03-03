const db = require("../models");
const GentleProgress = db.gentle_progress;

// Simple Rule-Based AI Recommendation Engine
const getRecommendations = (progress) => {
    let recommendations = [];

    // Pain Analysis
    if (progress.pain_level > 6) {
        recommendations.push({
            type: 'alert',
            message: 'Your pain level is high. Please consult a doctor immediately.',
            action: 'book_doctor'
        });
    } else if (progress.pain_level > 3) {
        recommendations.push({
            type: 'tip',
            message: 'Consider using a warm compress or gentle stretching.',
            action: 'self_care'
        });
    }

    // Mood Analysis
    const lowMoods = ['sad', 'anxious', 'overwhelmed', 'tearful'];
    if (lowMoods.includes(progress.mood?.toLowerCase())) {
        recommendations.push({
            type: 'support',
            message: 'It is okay to feel this way. Try a 5-minute breathing exercise.',
            action: 'meditation'
        });
    }

    // Hydration Analysis
    if (progress.hydration_count < 5) {
        recommendations.push({
            type: 'reminder',
            message: 'Stay hydrated! Drink at least 3 more glasses of water today.',
            action: 'drink_water'
        });
    }

    return recommendations;
};

exports.addProgress = (req, res) => {
    const progressData = {
        userId: req.userId,
        ...req.body
    };

    GentleProgress.create(progressData)
        .then(data => {
            // Generate recommendations on the fly
            const recommendations = getRecommendations(data);
            res.send({ ...data.toJSON(), recommendations });
        })
        .catch(err => {
            res.status(500).send({ message: err.message || "Some error occurred while creating progress." });
        });
};

exports.getUserProgress = (req, res) => {
    GentleProgress.findAll({
        where: { userId: req.params.userId },
        order: [['date', 'DESC']],
        limit: 7
    })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({ message: err.message || "Some error occurred while retrieving progress." });
        });
};

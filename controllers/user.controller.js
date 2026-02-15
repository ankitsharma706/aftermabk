const db = require("../models");
const User = db.user;
const MedicalProfile = db.medical_profile;

exports.getUserProfile = (req, res) => {
    User.findByPk(req.params.id, {
        attributes: { exclude: ['password'] },
        include: [{
            model: MedicalProfile,
            as: 'medical_profile' // default alias might be different, let's check index.js
        }]
    })
        .then(user => {
            if (!user) return res.status(404).send({ message: "User not found." });
            res.status(200).send(user);
        })
        .catch(err => {
            res.status(500).send({ message: err.message });
        });
};

exports.updateUserProfile = (req, res) => {
    User.update(req.body, {
        where: { id: req.params.id }
    })
        .then(num => {
            if (num == 1) {
                res.send({ message: "User was updated successfully." });
            } else {
                res.send({ message: `Cannot update User with id=${req.params.id}. Maybe User was not found or req.body is empty!` });
            }
        })
        .catch(err => {
            res.status(500).send({ message: "Error updating User with id=" + req.params.id });
        });
};

exports.updateMedicalProfile = (req, res) => {
    MedicalProfile.update(req.body, {
        where: { userId: req.params.userId }
    })
        .then(num => {
            if (num == 1) {
                res.send({ message: "Medical Profile updated successfully." });
            } else {
                // If it doesn't exist, create it (upsert-ish)
                MedicalProfile.create({
                    userId: req.params.userId,
                    ...req.body
                }).then(() => {
                    res.send({ message: "Medical Profile created successfully." });
                }).catch(err => {
                    res.status(500).send({ message: err.message });
                });
            }
        })
        .catch(err => {
            res.status(500).send({ message: "Error updating Medical Profile for user=" + req.params.userId });
        });
};

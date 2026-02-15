const db = require("../models");
const User = db.user;
const MedicalProfile = db.medical_profile;
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = (req, res) => {
    // Save User to Database
    User.create({
        full_name: req.body.full_name,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 8),
        role: req.body.role || 'mother'
    })
        .then(user => {
            // Create empty medical profile for mothers
            if (user.role === 'mother') {
                MedicalProfile.create({
                    userId: user.id
                });
            }
            res.send({ message: "User was registered successfully!" });
        })
        .catch(err => {
            res.status(500).send({ message: err.message });
        });
};

exports.signin = (req, res) => {
    User.findOne({
        where: {
            email: req.body.email
        }
    })
        .then(user => {
            if (!user) {
                return res.status(404).send({ message: "User Not found." });
            }

            var passwordIsValid = bcrypt.compareSync(
                req.body.password,
                user.password
            );

            if (!passwordIsValid) {
                return res.status(401).send({
                    accessToken: null,
                    message: "Invalid Password!"
                });
            }

            var token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
                expiresIn: 86400 // 24 hours
            });

            res.status(200).send({
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                accessToken: token
            });
        })
        .catch(err => {
            res.status(500).send({ message: err.message });
        });
};

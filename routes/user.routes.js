const authJwt = require("../middleware/authJwt");
const controller = require("../controllers/user.controller");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.get("/api/users/:id", [authJwt.verifyToken], controller.getUserProfile);
    app.put("/api/users/:id", [authJwt.verifyToken], controller.updateUserProfile);
    app.put("/api/medical/:userId", [authJwt.verifyToken], controller.updateMedicalProfile);
};

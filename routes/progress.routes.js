const controller = require("../controllers/progress.controller");
const authJwt = require("../middleware/authJwt");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.post("/api/progress", [authJwt.verifyToken], controller.addProgress);
    app.get("/api/progress/:userId", [authJwt.verifyToken], controller.getUserProgress);
};

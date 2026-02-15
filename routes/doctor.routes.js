const controller = require("../controllers/doctor.controller");
const authJwt = require("../middleware/authJwt");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.get("/api/doctors", [authJwt.verifyToken], controller.getAllDoctors);
    app.post("/api/doctors", [authJwt.verifyToken], controller.createDoctor); // Simplified access for demo
    app.post("/api/appointments", [authJwt.verifyToken], controller.bookAppointment);
    app.get("/api/appointments/:userId", [authJwt.verifyToken], controller.getUserAppointments);
};

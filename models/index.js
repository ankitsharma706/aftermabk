const sequelize = require("../config/db.config.js");
const Sequelize = require("sequelize");

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("./user.model.js")(sequelize, Sequelize);
db.medical_profile = require("./medical_profile.model.js")(sequelize, Sequelize);
db.gentle_progress = require("./gentle_progress.model.js")(sequelize, Sequelize);
db.doctor = require("./doctor.model.js")(sequelize, Sequelize);
db.appointment = require("./appointment.model.js")(sequelize, Sequelize);

// Associations
db.user.hasOne(db.medical_profile, { foreignKey: 'userId', as: 'medical_profile' });
db.medical_profile.belongsTo(db.user, { foreignKey: 'userId', as: 'user' });

db.user.hasMany(db.gentle_progress, { foreignKey: 'userId', as: 'gentle_progress' });
db.gentle_progress.belongsTo(db.user, { foreignKey: 'userId', as: 'user' });

db.doctor.hasMany(db.appointment, { foreignKey: 'doctorId', as: 'appointments' });
db.appointment.belongsTo(db.doctor, { foreignKey: 'doctorId', as: 'doctor' });

db.user.hasMany(db.appointment, { foreignKey: 'userId', as: 'user_appointments' });
db.appointment.belongsTo(db.user, { foreignKey: 'userId', as: 'user' });

module.exports = db;

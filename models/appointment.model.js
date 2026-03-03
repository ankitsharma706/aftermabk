module.exports = (sequelize, Sequelize) => {
    const Appointment = sequelize.define("appointments", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        appointment_date: {
            type: Sequelize.DATE
        },
        status: {
            type: Sequelize.ENUM('booked', 'completed', 'cancelled'),
            defaultValue: 'booked'
        }
    });

    return Appointment;
};

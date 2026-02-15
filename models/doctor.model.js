module.exports = (sequelize, Sequelize) => {
    const Doctor = sequelize.define("doctors", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        name: {
            type: Sequelize.STRING
        },
        specialization: {
            type: Sequelize.STRING
        },
        rating: {
            type: Sequelize.FLOAT
        },
        cost_per_session: {
            type: Sequelize.DECIMAL(10, 2)
        },
        availability: {
            type: Sequelize.JSONB // e.g., { "Mon": ["10:00", "14:00"], "Tue": ... }
        }
    });

    return Doctor;
};

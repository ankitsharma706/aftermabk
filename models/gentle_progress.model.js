module.exports = (sequelize, Sequelize) => {
    const GentleProgress = sequelize.define("gentle_progress", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        date: {
            type: Sequelize.DATEONLY,
            defaultValue: Sequelize.NOW
        },
        pain_level: {
            type: Sequelize.INTEGER,
            validate: { min: 1, max: 10 }
        },
        mood: {
            type: Sequelize.STRING
        },
        hydration_count: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        sleep_hours: {
            type: Sequelize.FLOAT
        },
        symptoms: {
            type: Sequelize.ARRAY(Sequelize.TEXT)
        },
        notes: {
            type: Sequelize.TEXT
        }
    });

    return GentleProgress;
};

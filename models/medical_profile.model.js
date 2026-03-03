module.exports = (sequelize, Sequelize) => {
    const MedicalProfile = sequelize.define("medical_profiles", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        delivery_date: {
            type: Sequelize.DATEONLY
        },
        delivery_type: {
            type: Sequelize.ENUM('vaginal', 'c-section')
        },
        allergies: {
            type: Sequelize.ARRAY(Sequelize.TEXT)
        },
        medical_history: {
            type: Sequelize.JSONB
        }
    });

    return MedicalProfile;
};

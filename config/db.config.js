const { Sequelize } = require('sequelize');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const databaseUrl = process.env.DATABASE_URL;

let sequelize;

if (databaseUrl) {
    sequelize = new Sequelize(databaseUrl, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: isProduction ? {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        } : {}
    });
} else {
    console.log("No DATABASE_URL found, using SQLite fallback.");
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: './database.sqlite', // Local file database
        logging: false
    });
}

module.exports = sequelize;

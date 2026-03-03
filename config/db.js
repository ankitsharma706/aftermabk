'use strict';

const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.database.uri);
        console.log(`✅ MongoDB connection established to database: ${conn.connection.name}`);
    } catch (error) {
        console.error('❌ Unable to connect to MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = { connectDB };

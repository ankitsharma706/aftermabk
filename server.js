const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database
const db = require("./models");

// Sync database
db.sequelize.sync().then(() => {
    console.log("Synced db.");
}).catch((err) => {
    console.log("Failed to sync db: " + err.message);
});

// Import Routes
const cppRoutes = require('./routes/cppRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const profileRoutes = require('./routes/profileRoutes');

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to AfterMaWell API.' });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Routes
app.use('/api', cppRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/profile', profileRoutes);

// Existing Routes
require('./routes/auth.routes')(app);
require('./routes/user.routes')(app);
require('./routes/progress.routes')(app);
// require('./routes/doctor.routes')(app); // Disabling the old doctor routes in favor of JSON routes for now

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

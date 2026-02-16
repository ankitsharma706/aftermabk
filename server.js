<<<<<<< HEAD
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;
=======
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config/config');
const connectDB = require('./config/db');
require('dotenv').config();

const cppRoutes = require('./routes/cppRoutes');
const userRoutes = require('./routes/userRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();

// Connect to Database
connectDB();
>>>>>>> 49a3fa4 (Initial backend commit)

// Middleware
app.use(cors());
app.use(bodyParser.json());
<<<<<<< HEAD
app.use(bodyParser.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to AfterMaWell API.' });
});

const db = require("./models");

// Sync database
db.sequelize.sync().then(() => {
    console.log("Synced db.");
}).catch((err) => {
    console.log("Failed to sync db: " + err.message);
});

// Routes
require('./routes/auth.routes')(app);
require('./routes/user.routes')(app);
require('./routes/progress.routes')(app);
require('./routes/doctor.routes')(app);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
=======

// Routes
app.use('/api', cppRoutes);
app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/profile', profileRoutes);

app.get('/', (req, res) => {
    res.send('C++ Execution Backend is running');
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Start Server
app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
>>>>>>> 49a3fa4 (Initial backend commit)
});

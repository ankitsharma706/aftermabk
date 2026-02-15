require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
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
});

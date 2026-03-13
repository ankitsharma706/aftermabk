'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const { connectDB } = require('./config/db');

// ── Routes ────────────────────────────────────────────────────
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const doctorRoutes = require('./routes/doctor.routes');
const sessionRoutes = require('./routes/session.routes');
const lactationRoutes = require('./routes/lactation.routes');
const dailyLogRoutes = require('./routes/dailyLog.routes');
const periodRoutes = require('./routes/period.routes');
const communityRoutes = require('./routes/community.routes');
const ngoRoutes = require('./routes/ngo.routes');
const medicineRoutes = require('./routes/medicine.routes');
const insuranceRoutes = require('./routes/insurance.routes');
const questionRoutes  = require('./routes/question.routes');

const app = express();

app.set('trust proxy', 1);

app.use((req, res, next) => {
    res.setTimeout(30000);
    next();
});
// ── Security ──────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
    origin: config.cors.origin || "*",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting ─────────────────────────────────────────────
app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
}));

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ── Logging ───────────────────────────────────────────────────
if (config.env !== 'test') app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

// ── Health check ──────────────────────────────────────────────
app.get('/', (_, res) => res.json({ status: 'ok', app: 'AfterMa API', version: '3.0' }));
app.get('/api/health', (_, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/lactation', lactationRoutes);
app.use('/api/logs', dailyLogRoutes);
app.use('/api/period', periodRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/questions', questionRoutes);

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) =>
    res.status(404).json({ status: 'error', message: `Route not found: ${req.method} ${req.path}` })
);

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || err.status || 500;
    return res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Internal server error.',
    });
});

// ── Start ─────────────────────────────────────────────────────
const start = async () => {
    try {
        await connectDB();

        app.listen(config.port, () => {
            console.log(`✅ AfterMa API v3.0 running on port ${config.port}`);
        });

    } catch (err) {
        console.error("❌ Server failed to start:", err);
        process.exit(1);
    }
};

start();

module.exports = app;

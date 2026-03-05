'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config/config');
const { connectDB } = require('./config/db');
const { errorHandler, notFound } = require('./middleware/error.middleware');

// ── Route imports ─────────────────────────────────────────────
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const dailyLogRoutes = require('./routes/dailyLog.routes');
const doctorRoutes = require('./routes/doctor.routes');
const communityRoutes = require('./routes/community.routes');
const ngoRoutes = require('./routes/ngo.routes');
const insuranceRoutes = require('./routes/insurance.routes');
const sessionRoutes = require('./routes/session.routes');
const medicineRoutes = require('./routes/medicine.routes');
const periodRoutes = require('./routes/period.routes');
const medicalProfileRoutes = require('./routes/medicalProfile.routes');

const app = express();

// ── Security Middleware ───────────────────────────────────────
app.use(helmet());

app.use(cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate Limiting ─────────────────────────────────────────────
const limiter = rateLimit({
    windowMs: config.security.rateLimitWindowMs,
    max: config.security.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        message: 'Too many requests from this IP. Please try again later.',
    },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        status: 'error',
        message: 'Too many authentication attempts. Please wait 15 minutes.',
    },
});

app.use('/api', limiter);
app.use('/api/auth', authLimiter);

// ── Body Parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ───────────────────────────────────────────────────
if (config.env !== 'test') {
    app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
}

// ── Health Check ──────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: '🌸 AFTERMA Healthcare Recovery Platform API',
        version: '2.0.0',
        environment: config.env,
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: '/api/auth',
            users: '/api/users  |  /api/user',
            doctors: '/api/doctors',
            sessions: '/api/sessions',
            period: '/api/period',
            medicalProfile: '/api/medical-profile',
            medicines: '/api/medicines',
            dailyLogs: '/api/logs',
            communities: '/api/communities',
            ngos: '/api/ngos',
            insurance: '/api/insurance',
        },
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'AFTERMA API is running.',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userRoutes);           // singular alias

app.use('/api/doctors', doctorRoutes);
app.use('/api/doctor', doctorRoutes);         // singular alias

app.use('/api/sessions', sessionRoutes);
app.use('/api/session', sessionRoutes);        // singular alias

app.use('/api/period', periodRoutes);
app.use('/api/medical-profile', medicalProfileRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/medicine', medicineRoutes);       // singular alias

app.use('/api/logs', dailyLogRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/insurance', insuranceRoutes);

// ── 404 Handler ───────────────────────────────────────────────
app.use(notFound);

// ── Global Error Handler ──────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────
const PORT = config.port;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log('');
        console.log('  🌸 ══════════════════════════════════════════ 🌸');
        console.log(`      AFTERMA Backend v2.0 running on port ${PORT}`);
        console.log(`      Environment : ${config.env}`);
        console.log(`      Mongo URI   : ${config.database.uri}`);
        console.log(`      URL         : http://localhost:${PORT}`);
        console.log('');
        console.log('  📡 Active Routes:');
        console.log('      POST/GET  /api/auth/register | login | me');
        console.log('      CRUD      /api/user | /api/users');
        console.log('      CRUD      /api/doctor | /api/doctors');
        console.log('      CRUD      /api/session | /api/sessions');
        console.log('      CRUD      /api/period');
        console.log('      CRUD      /api/medical-profile');
        console.log('      CRUD      /api/medicine | /api/medicines');
        console.log('      CRUD      /api/logs | /api/communities | /api/ngos | /api/insurance');
        console.log('  🌸 ══════════════════════════════════════════ 🌸');
        console.log('');
    });
};

startServer().catch((err) => {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
});

// ── Graceful Shutdown ─────────────────────────────────────────
process.on('SIGTERM', () => {
    console.log('📴 SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('unhandledRejection', (reason) => {
    console.error('💥 Unhandled Promise Rejection:', reason);
    process.exit(1);
});

module.exports = app;

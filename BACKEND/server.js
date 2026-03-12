const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const fs = require('fs');

dotenv.config();

const app = express();

// Trust proxy — required for correct IP/protocol detection behind LiteSpeed
app.set('trust proxy', 1);

// ============= ALLOWED ORIGINS =============
// Must be defined before anything else so corsOptions is available
const allowedOrigins = [
    'https://mmtsmmpanel.cyberservice.online',
    'https://admin.mmtsmmpanel.cyberservice.online',
    'http://localhost:3000',
    'http://localhost:5173',
];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (Postman, curl, mobile apps)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked request from: ${origin}`);
            callback(new Error(`CORS blocked: ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 200
};

// ============= CORS — MUST BE FIRST =============
// Handle preflight OPTIONS requests before helmet, rate limiters, or anything else
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// ============= UPLOAD FOLDER SETUP =============
const uploadDirs = [
    './uploads/receipts',
    './uploads/config',
    './uploads/payments',
    './uploads/profiles',
    './uploads/tickets',
];
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ============= SECURITY MIDDLEWARE =============
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc:   ["'self'", "'unsafe-inline'"],
            scriptSrc:  ["'self'"],
            imgSrc: [
                "'self'", "data:", "blob:",
                "https://mmtsmmpanel.cyberservice.online",
                "https://admin.mmtsmmpanel.cyberservice.online",
                "https://res.cloudinary.com",
                process.env.API_URL || "http://localhost:5000"
            ],
            connectSrc: [
                "'self'",
                "https://mmtsmmpanel.cyberservice.online",
                "https://admin.mmtsmmpanel.cyberservice.online",
                process.env.FRONTEND_URL || "http://localhost:3000"
            ],
            fontSrc: ["'self'", "data:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// ============= BODY PARSERS =============
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ============= SESSION =============
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// ============= PASSPORT =============
app.use(passport.initialize());
app.use(passport.session());

// ============= STATIC FILES (uploads) =============
app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.join(__dirname, 'uploads')));

// ============= DATABASE =============
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

const promisePool = pool.promise();

const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ MySQL Database connected successfully');
        console.log(`📊 Database: ${process.env.DB_NAME}`);
        connection.release();
    } catch (error) {
        console.error('❌ MySQL Database connection failed:', error.message);
        process.exit(1);
    }
};
testConnection();

// ============= PASSPORT SERIALIZATION =============
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const [users] = await promisePool.execute(
            'SELECT id, full_name, email, phone, whatsapp, profile_picture FROM users WHERE id = ?',
            [id]
        );
        done(null, users[0]);
    } catch (error) {
        done(error, null);
    }
});

// ============= RATE LIMITERS =============
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many attempts, try again later' },
    skipSuccessfulRequests: true
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    message: { success: false, message: 'Rate limit exceeded' }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/send-verification-code', authLimiter);
app.use('/api/auth/verify-code', authLimiter);
app.use('/api/', apiLimiter);

// ============= SECURITY HEADERS =============
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
});

// ============= IMPORT ROUTES =============
const authRoutes           = require('./routes/auth');
const userRoutes           = require('./routes/user');
const walletRoutes         = require('./routes/wallet');
const servicesRoutes       = require('./routes/services');
const ordersRoutes         = require('./routes/orders');
const depositRoutes        = require('./routes/deposit');
const ticketsRouter        = require('./routes/tickets');
const childPanelsRoutes    = require('./routes/child-panels');
const userSettingsRoutes   = require('./routes/user_settings');
const apiV2Routes          = require('./routes/api/v2');
const spinRoutes           = require('./routes/spin');
const blogsRoutes          = require('./routes/blogs');
const transferRoutes       = require('./routes/transfer');
const adminRoutes          = require('./routes/admin');
const depositDetailsRoutes = require('./routes/admin/deposit-details');
const adminDepositRoutes   = require('./routes/admin/deposit');
const usersViewRoute       = require('./routes/admin/users');
const blogsUpdateRoute     = require('./routes/admin/blogs');
const configRoutes         = require('./routes/admin/configs');
const adminAuthRouter      = require('./routes/admin-auth');
const adminTicketsRoutes   = require('./routes/admin.tickets');

// ============= REGISTER ROUTES =============
app.use('/api/auth',            authRoutes(promisePool));
app.use('/api/user',            userRoutes(promisePool));
app.use('/api/user',            userSettingsRoutes(promisePool));
app.use('/api/wallet',          walletRoutes(promisePool));
app.use('/api/services',        servicesRoutes(promisePool));
app.use('/api/orders',          ordersRoutes(promisePool));
app.use('/api/tickets',         ticketsRouter(promisePool));
app.use('/api/child-panels',    childPanelsRoutes(promisePool));
app.use('/api/deposit',         depositRoutes(promisePool));
app.use('/api/v2',              apiV2Routes(promisePool));
app.use('/api/spin',            spinRoutes(promisePool));
app.use('/api/blogs',           blogsRoutes(promisePool));
app.use('/api/transfer',        transferRoutes(promisePool));
app.use('/api/admin',           adminRoutes(promisePool));
app.use('/api/deposit-details', depositDetailsRoutes(promisePool));
app.use('/api/admin/deposits',  adminDepositRoutes(promisePool));
app.use('/api/admin/users',     usersViewRoute(promisePool));
app.use('/api/admin/blogs',     blogsUpdateRoute(promisePool));
app.use('/api/admin/config',    configRoutes(promisePool));
app.use('/api/admin/auth',      adminAuthRouter(promisePool));
app.use('/api/admin/tickets',   adminTicketsRoutes(promisePool));

// ============= HEALTH CHECK =============
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// ============= ERROR HANDLER =============
app.use((err, req, res, next) => {
    if (err.message && err.message.startsWith('CORS blocked')) {
        return res.status(403).json({
            success: false,
            message: err.message
        });
    }
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
});

// ============= 404 HANDLER =============
app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ============= START SERVER =============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV}`);
    console.log(`✅ Allowed CORS origins: ${allowedOrigins.join(', ')}`);
});

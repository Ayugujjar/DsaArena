const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const { initProgressCron } = require('./jobs/updateStudentProgress');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const userRoutes = require('./routes/userRoutes');
const batchRoutes = require('./routes/batchRoutes');
const progressRoutes = require('./routes/progressRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const { adminApiLimiter } = require('./middleware/rateLimiters');
const { validateRequestShape } = require('./middleware/requestValidation');
const { hasUnsafeMongoInput } = require('./middleware/safeMongoInput');
const { hasAllowedOrigin } = require('./utils/authCookies');

const app = express();
app.disable('x-powered-by');
const isProduction = process.env.NODE_ENV === 'production';
const frontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

if (isProduction) {
  for (const secretName of ['JWT_SECRET', 'ADMIN_JWT_SECRET']) {
    const secret = process.env[secretName];
    if (!secret || secret.length < 32 || secret.startsWith('replace-with-')) {
      throw new Error(`${secretName} must contain at least 32 characters in production`);
    }
  }
  if (process.env.JWT_SECRET === process.env.ADMIN_JWT_SECRET) {
    throw new Error('JWT_SECRET and ADMIN_JWT_SECRET must be different');
  }
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be configured in production');
  }
}

if (
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET.length < 32 ||
  process.env.JWT_SECRET.startsWith('replace-with-') ||
  !process.env.ADMIN_JWT_SECRET ||
  process.env.ADMIN_JWT_SECRET.length < 32 ||
  process.env.ADMIN_JWT_SECRET.startsWith('replace-with-')
) {
  throw new Error('JWT_SECRET and ADMIN_JWT_SECRET must each contain at least 32 characters');
}

if (!frontendOrigins.length || frontendOrigins.some((origin) => {
  try {
    const parsed = new URL(origin);
    return !['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin;
  } catch {
    return true;
  }
})) {
  throw new Error('FRONTEND_URL must contain one or more valid web origins');
}

const proxyHops = process.env.TRUST_PROXY_HOPS === undefined ? 0 : Number(process.env.TRUST_PROXY_HOPS);
if (!Number.isSafeInteger(proxyHops) || proxyHops < 0) {
  throw new Error('TRUST_PROXY_HOPS must be a non-negative integer');
}
app.set('trust proxy', proxyHops);

// Security Middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => callback(null, !origin || frontendOrigins.includes(origin)),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    maxAge: 600,
  })
);

// Rate limiter for general requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);
app.use('/api/admin', adminApiLimiter);

app.use((req, res, next) => {
  if (!hasAllowedOrigin(req)) {
    return res.status(403).json({ success: false, message: 'Request origin is not allowed' });
  }
  next();
});

app.use(express.json({ limit: '3mb', strict: true }));
app.use(express.urlencoded({ extended: false, limit: '10kb', parameterLimit: 100 }));
app.use((req, res, next) => {
  if (req.body === undefined) req.body = {};
  next();
});
app.use(validateRequestShape);
app.use((req, res, next) => {
  const userInput = [req.body, req.query, req.params];
  if (userInput.some(hasUnsafeMongoInput)) {
    return res.status(400).json({ success: false, message: 'Request contains invalid or overly complex fields' });
  }
  next();
});

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'DsArena API',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/integrations', integrationRoutes);

// Error Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 5000);
if (!Number.isSafeInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error('PORT must be a valid TCP port');
}

const startServer = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`[Server] DsArena Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    initProgressCron();
  });
  return server;
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error(`[Server] Startup failed: ${error.name || 'Database connection error'}`);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };

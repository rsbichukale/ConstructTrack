const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const config = require('./src/config');
const requestLogger = require('./src/middleware/requestLogger');
const errorHandler = require('./src/middleware/errorHandler');
const apiRouter = require('./src/routes');

const app = express();
app.set('trust proxy', 1);

// 1. HTTP Security Headers with Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Allows Next.js frontend hydration scripts to run smoothly
  crossOriginEmbedderPolicy: false
}));

// 2. Environment-driven CORS allowlist. Same-origin and non-browser requests remain valid.
const allowedOrigins = new Set(config.CORS_ORIGINS);
app.use(cors((req, callback) => {
  const origin = req.header('Origin');
  const requestOrigin = `${req.protocol}://${req.get('host')}`;
  const isAllowed = !origin || origin === requestOrigin || allowedOrigins.has(origin.replace(/\/$/, ''));

  callback(null, {
    origin: isAllowed,
    credentials: true
  });
}));

// 3. Response Compression (GZIP / Brotli)
app.use(compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// 4. Rate Limiting Protection
const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please slow down.' }
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts. Please try again in 15 minutes.' }
});

const setupRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 setup initializations per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many project initializations requested. Please wait before re-initializing.' }
});

app.use('/api/', generalApiLimiter);
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);
app.use('/api/setup/initialize', setupRateLimiter);

const path = require('path');

// 5. Body Parsers with Controlled Limits (Supports High-Res Drawings & Site Photos)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(requestLogger);

// 6. Static File Storage Serving (Fast local document & image streaming)
app.use('/storage', express.static(path.resolve(__dirname, '../storage')));

// 7. Centralized API Router Mounting
app.use('/api', apiRouter);

// 8. Central Error Handler
app.use(errorHandler);

// Start Server
if (require.main === module) {
  app.listen(config.PORT, '0.0.0.0', () => {
    console.log(`🚀 [ConstructTrack Express API] Server running on http://0.0.0.0:${config.PORT}`);
    console.log(`🔒 [Security] Helmet & CORS whitelist active`);
    console.log(`⚡ [Local PostgreSQL DB] Native pg.Pool connected to constructtrack_db`);
  });
}

module.exports = app;

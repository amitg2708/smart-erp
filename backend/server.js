const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const logger = require('./utils/logger');
const swaggerSpec = require('./utils/swagger');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const resultRoutes = require('./routes/result');
const feeRoutes = require('./routes/fee');
const attendanceRoutes = require('./routes/attendance');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');
const documentRoutes = require('./routes/documents');
const courseRoutes = require('./routes/courses');
const calendarRoutes = require('./routes/calendar');
const auditLogRoutes = require('./routes/auditlogs');
const exportRoutes = require('./routes/export');
const collegeRoutes = require('./routes/college');

const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');

const app = express();

// ─── Security & Performance ─────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(compression());

// ─── CORS ──────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.PROD_URL,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow Postman

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ─── Body Parsing ──────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logger ────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(
    process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
    { stream: { write: (msg) => logger.info(msg.trim()) } }
  ));
}

// ─── Static Files ──────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Swagger Docs ──────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Smart College ERP API Docs',
}));

app.get('/api/docs.json', (req, res) => {
  res.json(swaggerSpec);
});

// ─── Rate Limiting ─────────────────────────────────────
app.use('/api', generalLimiter);

// ─── Routes ────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/result', resultRoutes);
app.use('/api/fee', feeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/auditlogs', auditLogRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/college', collegeRoutes);

// ─── Health Check ──────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Smart College ERP API is running',
    docs: '/api/docs',
    health: '/api/health',
  });
});

// ─── 404 Handler ───────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ──────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`${err.message}`);

  if (err.message?.startsWith('CORS')) {
    return res.status(403).json({ message: err.message });
  }

  if (err.name === 'ValidationError') {
    return res.status(422).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      message: `Invalid ${err.path}: ${err.value}`
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      message: `${field} already exists`
    });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ─── MongoDB Connection ────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  logger.error('❌ MONGO_URI not defined');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(async () => {
    logger.info('✅ MongoDB connected');

    // Create indexes safely
    try {
      const db = mongoose.connection.db;

      await db.collection('students').createIndex({ rollNumber: 1 }, { unique: true });
      await db.collection('students').createIndex({ userId: 1, course: 1, year: 1 });
      await db.collection('results').createIndex({ studentId: 1, semester: 1 });
      await db.collection('fees').createIndex({ studentId: 1, status: 1 });
      await db.collection('users').createIndex({ email: 1 }, { unique: true });

      logger.info('📊 Indexes ensured');
    } catch (err) {
      logger.warn(`⚠️ Index warning: ${err.message}`);
    }
const port = process.env.PORT || 4000

app.listen(port, '0.0.0.0', () => {
  console.log(`Example app listening on port ${port}`)
})
  })
  .catch(err => {
    logger.error(`❌ MongoDB connection error: ${err.message}`);
    process.exit(1);
  });

// ─── Graceful Shutdown ─────────────────────────────────
process.on('SIGINT', async () => {
  logger.info('Shutting down server...');
  await mongoose.connection.close();
  process.exit(0);
});

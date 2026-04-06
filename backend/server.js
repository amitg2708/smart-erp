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

// ─── Security & Performance Middleware ─────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow static file access
}));
app.use(compression());

// ─── CORS Configuration ─────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  process.env.PROD_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ─── Body Parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── HTTP Request Logger ────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// ─── Static Files ───────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Swagger API Docs ───────────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Smart College ERP API Docs',
  customCss: '.swagger-ui .topbar { background-color: #6366f1; }',
}));
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ─── Rate Limiting ──────────────────────────────────────────────────────────────
app.use('/api', generalLimiter);

// ─── Routes ─────────────────────────────────────────────────────────────────────
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

// ─── Health Check ────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    version: '2.1.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Smart College ERP API is running',
    version: '2.1.0',
    docs: '/api/docs',
    health: '/api/health',
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  // Handle CORS errors
  if (err.message && err.message.startsWith('CORS')) {
    return res.status(403).json({ message: err.message });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return res.status(422).json({ message: 'Validation Error', errors });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }

  // Handle duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ message: `${field} already exists` });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── MongoDB Connection & Server Start ─────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    logger.info('✅ MongoDB connected');

    // Add indexes for performance
    mongoose.connection.db.collection('students').createIndex({ rollNumber: 1 }, { unique: true, background: true });
    mongoose.connection.db.collection('students').createIndex({ userId: 1, course: 1, year: 1 }, { background: true });
    mongoose.connection.db.collection('results').createIndex({ studentId: 1, semester: 1 }, { background: true });
    mongoose.connection.db.collection('fees').createIndex({ studentId: 1, status: 1 }, { background: true });
    mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true, background: true });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
      logger.info(`📚 API Docs: http://localhost:${PORT}/api/docs`);
    });
  })
  .catch((err) => {
    logger.error(`❌ MongoDB connection error: ${err.message}`);
    process.exit(1);
  });

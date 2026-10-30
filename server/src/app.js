import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student.routes.js';
import facultyRoutes from './routes/faculty.routes.js';
import adminRoutes from './routes/admin.routes.js';
import reportRoutes from './routes/report.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security and utility middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', loginLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Logisys Smart Attendance System API',
    version: '1.0.0',
  });
});

// Static file serving for proofs and avatars
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount modular routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`,
  });
});

// Centralized error handling middleware
app.use(errorHandler);

// Start server if not imported by test runner
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Logisys Attendance API Server listening on http://localhost:${PORT}`);
  });
}

export default app;

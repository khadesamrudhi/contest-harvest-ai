// server.js - Main Entry Point for ContentHarvest AI Backend

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import middleware
const errorHandler = require('./src/middleware/error.middleware');
const authMiddleware = require('./src/middleware/auth.middleware');

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const competitorRoutes = require('./src/routes/competitor.routes');
const scrapingRoutes = require('./src/routes/scraping.routes');
const assetRoutes = require('./src/routes/asset.routes');
const trendRoutes = require('./src/routes/trend.routes');
const contentRoutes = require('./src/routes/content.routes');
const aiRoutes = require('./src/routes/ai.routes');
const storyblokRoutes = require('./src/routes/storyblok.routes');

// Import services
const { initializeDatabase } = require('./src/integrations/storage/SupabaseClient');
const { initializeScrapingScheduler } = require('./src/scrapers/scheduler/ScrapingScheduler');
const { setupSocketHandlers } = require('./src/websockets/socketHandlers');
const logger = require('./src/utils/logger');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use('/api', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'ContentHarvest AI Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/competitors', authMiddleware, competitorRoutes);
app.use('/api/scraping', authMiddleware, scrapingRoutes);
app.use('/api/assets', authMiddleware, assetRoutes);
app.use('/api/trends', authMiddleware, trendRoutes);
app.use('/api/content', authMiddleware, contentRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/storyblok', authMiddleware, storyblokRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize database and services
async function startServer() {
  try {
    // Initialize database connection
    await initializeDatabase();
    logger.info('Database connected successfully');

    // Initialize scraping scheduler
    await initializeScrapingScheduler();
    logger.info('Scraping scheduler initialized');

    // Setup WebSocket handlers
    setupSocketHandlers(io);
    logger.info('WebSocket handlers configured');

    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(`ContentHarvest AI Backend running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();
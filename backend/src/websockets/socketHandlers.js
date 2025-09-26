const logger = require('../utils/logger');

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Join user-specific room
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      logger.info(`User ${userId} joined room`);
    });

    // Handle scraping status updates
    socket.on('scraping_status', (data) => {
      socket.to(`user_${data.userId}`).emit('scraping_update', data);
    });

    // Handle trend updates
    socket.on('trend_update', (data) => {
      io.emit('trend_notification', data);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Utility functions to emit events
const emitScrapingUpdate = (io, userId, data) => {
  io.to(`user_${userId}`).emit('scraping_update', data);
};

const emitTrendNotification = (io, data) => {
  io.emit('trend_notification', data);
};

module.exports = {
  setupSocketHandlers,
  emitScrapingUpdate,
  emitTrendNotification
};
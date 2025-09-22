// src/middleware/error.middleware.js

const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    user: req.user?.id
  });

  // Default error
  let error = {
    success: false,
    message: 'Internal Server Error'
  };

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error.message = 'Resource not found';
    return res.status(404).json(error);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    error.message = 'Duplicate field value entered';
    return res.status(400).json(error);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map(val => val.message).join(', ');
    return res.status(400).json(error);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    return res.status(401).json(error);
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    return res.status(401).json(error);
  }

  // Supabase errors
  if (err.code && err.code.startsWith('PG')) {
    switch (err.code) {
      case 'PGRST116':
        error.message = 'Resource not found';
        return res.status(404).json(error);
      case 'PGRST301':
        error.message = 'Insufficient permissions';
        return res.status(403).json(error);
      default:
        error.message = 'Database error';
        return res.status(500).json(error);
    }
  }

  // Rate limiting
  if (err.statusCode === 429) {
    error.message = 'Too many requests, please try again later';
    return res.status(429).json(error);
  }

  // Custom API errors
  if (err.statusCode) {
    error.message = err.message;
    return res.status(err.statusCode).json(error);
  }

  // Default to 500 server error
  res.status(500).json(error);
};

module.exports = errorHandler;
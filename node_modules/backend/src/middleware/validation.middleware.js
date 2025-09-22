// src/middleware/validation.middleware.js

const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    logger.warn('Validation failed:', { 
      path: req.path,
      method: req.method,
      errors: errorMessages 
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }

  next();
};

module.exports = validationMiddleware;

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

// src/utils/logger.js

const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'contentharvest-ai' },
  transports: [
    // Write to all logs with level `info` and below to `combined.log`
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// If we're not in production, also log to the console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;

// src/utils/helpers.js

const crypto = require('crypto');
const { URL } = require('url');

class Helpers {
  // Generate random string
  static generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Hash string
  static hashString(string, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(string).digest('hex');
  }

  // Validate URL
  static isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Normalize URL
  static normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      // Remove trailing slash
      urlObj.pathname = urlObj.pathname.replace(/\/+$/, '') || '/';
      // Sort query parameters
      urlObj.searchParams.sort();
      return urlObj.href;
    } catch (error) {
      return url;
    }
  }

  // Extract domain from URL
  static extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch (error) {
      return null;
    }
  }

  // Sanitize string for database
  static sanitizeString(str) {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/\s+/g, ' ');
  }

  // Format date to ISO string
  static formatDate(date) {
    return new Date(date).toISOString();
  }

  // Calculate reading time
  static calculateReadingTime(text, wordsPerMinute = 200) {
    if (!text || typeof text !== 'string') return 0;
    const wordCount = text.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  // Truncate text
  static truncateText(text, maxLength = 100) {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  // Deep clone object
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Remove duplicate items from array
  static removeDuplicates(array, key = null) {
    if (!Array.isArray(array)) return [];
    
    if (key) {
      const seen = new Set();
      return array.filter(item => {
        const val = item[key];
        if (seen.has(val)) return false;
        seen.add(val);
        return true;
      });
    }
    
    return [...new Set(array)];
  }

  // Delay execution
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Retry function with exponential backoff
  static async retry(fn, maxAttempts = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await this.delay(delay);
      }
    }
  }

  // Parse JSON safely
  static parseJSON(str, defaultValue = null) {
    try {
      return JSON.parse(str);
    } catch (error) {
      return defaultValue;
    }
  }

  // Generate slug from text
  static generateSlug(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  // Format file size
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((
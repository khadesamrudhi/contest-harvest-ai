// src/middleware/rateLimit.middleware.js

const rateLimit = require('express-rate-limit');

// Simple rate limiter for hackathon/demo use
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later.' },
});

module.exports = limiter;

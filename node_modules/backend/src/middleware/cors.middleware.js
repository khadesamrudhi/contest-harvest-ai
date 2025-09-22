// src/middleware/cors.middleware.js

const cors = require('cors');

// Simple CORS middleware for hackathon/demo use
const corsOptions = {
  origin: '*', // Allow all origins (for demo/hackathon only)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = cors(corsOptions);

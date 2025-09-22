// src/middleware/auth.middleware.js

const jwt = require('jsonwebtoken');
const { supabaseClient } = require('../integrations/storage/SupabaseClient');

// Minimal JWT authentication middleware for hackathon/demo use
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await supabaseClient.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    req.user = { id: user.id, email: user.email, name: user.name };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

module.exports = authMiddleware;
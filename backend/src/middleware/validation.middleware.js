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
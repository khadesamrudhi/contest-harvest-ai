const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const validateRegistration = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const validateCompetitor = [
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('website').isURL().withMessage('Valid website URL required'),
  body('description').optional().trim(),
  body('industry').optional().trim(),
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateCompetitor,
  handleValidationErrors
};
// validators.js
// Centralized custom validators for express-validator and other uses

const { body, param, query } = require('express-validator');
const Helpers = require('./helpers');

// Example: User registration validation
const registerValidator = [
  body('username')
    .isString().withMessage('Username must be a string')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('email')
    .isEmail().withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// Example: Login validation
const loginValidator = [
  body('email')
    .isEmail().withMessage('Invalid email address'),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

// Example: ID param validation
const idParamValidator = [
  param('id')
    .isUUID().withMessage('Invalid ID format'),
];

// Example: URL validation
const urlValidator = [
  body('url')
    .custom((value) => Helpers.isValidUrl(value)).withMessage('Invalid URL'),
];

// Example: Query pagination validation
const paginationValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
];

module.exports = {
  registerValidator,
  loginValidator,
  idParamValidator,
  urlValidator,
  paginationValidator,
};

// src/utils/constants.js

module.exports = {
  // HTTP Status Codes
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    SERVER_ERROR: 500
  },

  // User Roles
  USER_ROLES: {
    ADMIN: 'admin',
    USER: 'user',
    MODERATOR: 'moderator'
  },

  // Content Types
  CONTENT_TYPES: {
    ARTICLE: 'article',
    VIDEO: 'video',
    IMAGE: 'image',
    PODCAST: 'podcast',
    PDF: 'pdf'
  },

  // Content Status
  CONTENT_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    ARCHIVED: 'archived'
  },

  // API Limits
  LIMITS: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_REQUESTS_PER_HOUR: 1000,
    MAX_CONTENT_LENGTH: 50000,
    PASSWORD_MIN_LENGTH: 8,
    OTP_EXPIRY_MINUTES: 10,
    JWT_EXPIRY: '24h'
  },

  // Supported File Types
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/json'
  ],

  // Error Messages
  ERRORS: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    TOKEN_EXPIRED: 'Token has expired',
    USER_NOT_FOUND: 'User not found',
    CONTENT_NOT_FOUND: 'Content not found',
    UNAUTHORIZED_ACCESS: 'Unauthorized access',
    FILE_TOO_LARGE: 'File size exceeds limit',
    INVALID_FILE_TYPE: 'File type not supported',
    RATE_LIMIT_EXCEEDED: 'Too many requests'
  },

  // Success Messages
  SUCCESS: {
    USER_CREATED: 'User created successfully',
    LOGIN_SUCCESS: 'Login successful',
    CONTENT_CREATED: 'Content created successfully',
    CONTENT_UPDATED: 'Content updated successfully',
    CONTENT_DELETED: 'Content deleted successfully',
    PASSWORD_RESET: 'Password reset successfully'
  },

  // Database Collections/Tables
  COLLECTIONS: {
    USERS: 'users',
    CONTENT: 'content',
    SESSIONS: 'sessions',
    LOGS: 'logs'
  },

  // AI Processing
  AI_CONFIG: {
    MAX_TOKENS: 4000,
    TEMPERATURE: 0.7,
    DEFAULT_MODEL: 'gpt-3.5-turbo',
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3
  },

  // Cache Settings
  CACHE: {
    TTL: 3600, // 1 hour
    MAX_SIZE: 1000,
    REDIS_PREFIX: 'ch:'
  },

  // Environment Types
  ENVIRONMENTS: {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    TEST: 'test'
  },

  // Regex Patterns
  PATTERNS: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    URL: /^https?:\/\/.+/,
    PHONE: /^\+?[\d\s\-\(\)]+$/,
    STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  },

  // Default Config
  DEFAULTS: {
    PAGE_SIZE: 20,
    SORT_ORDER: 'desc',
    LANGUAGE: 'en',
    TIMEZONE: 'UTC',
    DATE_FORMAT: 'YYYY-MM-DD',
    CURRENCY: 'USD'
  }
};
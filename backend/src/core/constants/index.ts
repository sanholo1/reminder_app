/**
 * Application constants and configuration values
 */

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Default pagination values
 */
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * Database limits and constraints
 */
export const DATABASE_LIMITS = {
  REMINDER_ACTIVITY_MAX_LENGTH: 500,
  REMINDER_CATEGORY_MAX_LENGTH: 100,
  USER_USERNAME_MAX_LENGTH: 100,
  USER_PASSWORD_MIN_LENGTH: 8,
  SESSION_ID_LENGTH: 255,
} as const;

/**
 * Authentication constants
 */
export const AUTH_CONSTANTS = {
  JWT_EXPIRES_IN: '24h',
  BCRYPT_SALT_ROUNDS: 10,
  SESSION_COOKIE_NAME: 'session_id',
  BEARER_PREFIX: 'Bearer ',
} as const;

/**
 * Rate limiting constants
 */
export const RATE_LIMITS = {
  DAILY_REMINDERS_LIMIT: 50,
  REQUESTS_PER_MINUTE: 60,
  ABUSE_THRESHOLD: 10,
  BLOCK_DURATION_MINUTES: 30,
} as const;

/**
 * Cache constants
 */
export const CACHE_KEYS = {
  USER_SESSION: 'user_session:',
  DAILY_USAGE: 'daily_usage:',
  BLOCKED_SESSIONS: 'blocked_sessions:',
} as const;

/**
 * File and logging constants
 */
export const FILE_CONSTANTS = {
  LOG_FILE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  LOG_RETENTION_DAYS: 30,
  LOG_DATE_FORMAT: 'YYYY-MM-DD',
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  VALIDATION_FAILED: 'Validation failed',
  UNAUTHORIZED_ACCESS: 'Unauthorized access',
  RESOURCE_NOT_FOUND: 'Resource not found',
  DATABASE_CONNECTION_ERROR: 'Database connection error',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  INVALID_CREDENTIALS: 'Invalid credentials',
  SESSION_EXPIRED: 'Session expired',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  DAILY_LIMIT_EXCEEDED: 'Daily reminder limit exceeded',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  REMINDER_CREATED: 'Reminder created successfully',
  REMINDER_UPDATED: 'Reminder updated successfully',
  REMINDER_DELETED: 'Reminder deleted successfully',
  USER_AUTHENTICATED: 'User authenticated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
} as const;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  HEALTH: '/health',
  HEALTH_LIVE: '/health/live',
  HEALTH_READY: '/health/ready',
  AUTH_LOGIN: '/auth/login',
  AUTH_CHANGE_PASSWORD: '/auth/change-password',
  REMINDERS: '/reminders',
  CATEGORIES: '/categories',
  TRASH: '/trash',
} as const;

/**
 * Date and time constants
 */
export const TIME_CONSTANTS = {
  MILLISECONDS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
} as const;
/**
 * Global type definitions for the Reminder App backend
 */

/**
 * Base entity interface - all entities should extend this
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * API Response wrapper interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Pagination interface
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * User session context
 */
export interface UserContext {
  userId: string;
  sessionId: string;
  username?: string;
}

/**
 * Request with user context
 */
export interface AuthenticatedRequest extends Express.Request {
  user: UserContext;
}

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Health check status
 */
export type HealthStatus = 'ok' | 'error' | 'warning';

/**
 * Database connection status
 */
export type DatabaseStatus = 'connected' | 'disconnected' | 'connecting';

/**
 * Environment types
 */
export type Environment = 'development' | 'production' | 'test' | 'staging';

/**
 * Generic error response structure
 */
export interface ErrorResponse {
  error: string;
  status: number;
  timestamp: string;
  path?: string;
  details?: any;
}
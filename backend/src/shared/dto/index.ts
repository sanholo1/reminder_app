/**
 * Data Transfer Objects (DTOs) for API requests and responses
 */

/**
 * Authentication DTOs
 */
export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface LoginResponseDto {
  token: string;
  user: {
    id: string;
    username: string;
  };
  expiresIn: string;
}

export interface ChangePasswordRequestDto {
  oldPassword: string;
  newPassword: string;
}

/**
 * Reminder DTOs
 */
export interface CreateReminderRequestDto {
  text: string;
  category?: string;
}

export interface CreateReminderResponseDto {
  id: string;
  activity: string;
  datetime: string;
  category?: string;
  timeNotRecognized?: boolean;
}

export interface UpdateReminderRequestDto {
  activity?: string;
  datetime?: string;
  category?: string;
}

export interface ReminderResponseDto {
  id: string;
  activity: string;
  datetime: string;
  category?: string;
  createdAt: string;
  userId: string;
  sessionId: string;
}

/**
 * Category DTOs
 */
export interface CategoryResponseDto {
  name: string;
  count: number;
}

export interface CreateCategoryRequestDto {
  name: string;
}

/**
 * Trash DTOs
 */
export interface TrashItemResponseDto {
  id: string;
  activity: string;
  datetime: string;
  category?: string;
  deletedAt: string;
  originalId: string;
}

export interface RestoreFromTrashRequestDto {
  itemId: string;
}

/**
 * User DTOs
 */
export interface UserResponseDto {
  id: string;
  username: string;
  createdAt: string;
}

/**
 * Health Check DTOs
 */
export interface HealthCheckResponseDto {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  checks: {
    database: {
      status: 'connected' | 'disconnected';
      responseTime?: number;
      error?: string;
    };
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

/**
 * Error DTOs
 */
export interface ErrorResponseDto {
  error: string;
  status: number;
  timestamp: string;
  path?: string;
  details?: any;
}

/**
 * Validation Error DTO
 */
export interface ValidationErrorDto {
  field: string;
  message: string;
  value?: any;
}

/**
 * Usage Statistics DTO
 */
export interface UsageStatsResponseDto {
  dailyRemaining: number;
  dailyLimit: number;
  dailyUsed: number;
  isBlocked: boolean;
  blockExpiresAt?: string;
}
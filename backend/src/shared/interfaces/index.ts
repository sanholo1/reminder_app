/**
 * Shared interfaces for the application
 */

/**
 * Repository interfaces
 */
export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: Partial<T>): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

/**
 * Service interfaces
 */
export interface IUserSessionService {
  createSession(userId: string): Promise<string>;
  validateSession(sessionId: string): Promise<boolean>;
  getUserBySession(sessionId: string): Promise<any>;
  incrementDailyUsage(sessionId: string): Promise<number>;
  checkDailyLimit(sessionId: string): Promise<boolean>;
  blockSession(sessionId: string, reason: string): Promise<void>;
  unblockSession(sessionId: string): Promise<void>;
}

export interface ILLMParserService {
  parseReminder(text: string, sessionId: string, userId: string): Promise<any>;
  validateInput(text: string): boolean;
}

/**
 * Logger interface
 */
export interface ILogger {
  debug(message: any, meta?: Record<string, any>): void;
  info(message: any, meta?: Record<string, any>): void;
  warn(message: any, meta?: Record<string, any>): void;
  error(message: any, meta?: Record<string, any>): void;
}

/**
 * Configuration interfaces
 */
export interface IDatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface IAppConfig {
  port: number;
  nodeEnv: string;
}

export interface IAuthConfig {
  jwtSecret: string;
  adminUser: string;
  adminPassword: string;
}

export interface IServicesConfig {
  openaiApiKey: string;
}

export interface ILoggingConfig {
  logDir?: string;
  logFile?: string;
  logToFile: boolean;
}

/**
 * Middleware interfaces
 */
export interface IAuthMiddleware {
  requireAuth(req: any, res: any, next: any): void;
}

export interface ISessionMiddleware {
  extractSessionId(req: any, res: any, next: any): void;
  checkBlocked(req: any, res: any, next: any): void;
}

/**
 * Command interfaces (CQRS pattern)
 */
export interface ICommand<TResult = void> {
  execute(): Promise<TResult>;
}

export interface IQuery<TResult> {
  execute(): Promise<TResult>;
}

/**
 * Event interfaces
 */
export interface IDomainEvent {
  eventType: string;
  aggregateId: string;
  timestamp: Date;
  data: any;
}

export interface IEventHandler<T extends IDomainEvent> {
  handle(event: T): Promise<void>;
}

/**
 * Cache interface
 */
export interface ICache {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

/**
 * Notification interface
 */
export interface INotificationService {
  sendNotification(userId: string, message: string, type: string): Promise<void>;
  scheduleNotification(userId: string, message: string, scheduledAt: Date): Promise<void>;
}

/**
 * Health check interfaces
 */
export interface IHealthCheck {
  name: string;
  check(): Promise<{ status: 'ok' | 'error'; details?: any }>;
}

export interface IHealthService {
  getHealthStatus(): Promise<any>;
  registerHealthCheck(check: IHealthCheck): void;
}
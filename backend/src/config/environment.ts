import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface EnvironmentConfig {
  // Database configuration
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };

  // Application configuration
  app: {
    port: number;
    nodeEnv: string;
  };

  // Authentication configuration
  auth: {
    jwtSecret: string;
    adminUser: string;
    adminPassword: string;
  };

  // External services
  services: {
    openaiApiKey: string;
  };

  // Logging configuration
  logging: {
    logDir?: string;
    logFile?: string;
    logToFile: boolean;
  };
}

/**
 * List of required environment variables
 */
const REQUIRED_ENV_VARS = [
  'DB_HOST',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_DATABASE',
  'JWT_SECRET',
  'ADMIN_USER',
  'ADMIN_PASSWORD',
  'OPENAI_API_KEY',
] as const;

/**
 * Validates that all required environment variables are present
 * @throws Error if any required environment variables are missing
 */
export function validateEnvironment(): void {
  const missing = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file and ensure all required variables are set.'
    );
  }

  // Validate specific format requirements
  const validationErrors: string[] = [];

  // Validate port numbers
  const dbPort = process.env.DB_PORT;
  if (dbPort && isNaN(parseInt(dbPort))) {
    validationErrors.push('DB_PORT must be a valid number');
  }

  const appPort = process.env.PORT;
  if (appPort && isNaN(parseInt(appPort))) {
    validationErrors.push('PORT must be a valid number');
  }

  // Validate JWT secret length (should be at least 32 characters for security)
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    validationErrors.push('JWT_SECRET should be at least 32 characters long for security');
  }

  // Validate admin password strength (basic check)
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword && adminPassword.length < 8) {
    validationErrors.push('ADMIN_PASSWORD should be at least 8 characters long');
  }

  if (validationErrors.length > 0) {
    throw new Error(
      `Environment validation errors:\n${validationErrors.map(err => `- ${err}`).join('\n')}`
    );
  }
}

/**
 * Creates and validates the environment configuration
 * @returns Validated environment configuration object
 */
export function createEnvironmentConfig(): EnvironmentConfig {
  validateEnvironment();

  return {
    database: {
      host: process.env.DB_HOST!,
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_DATABASE!,
    },

    app: {
      port: parseInt(process.env.PORT || '3001'),
      nodeEnv: process.env.NODE_ENV || 'development',
    },

    auth: {
      jwtSecret: process.env.JWT_SECRET!,
      adminUser: process.env.ADMIN_USER!,
      adminPassword: process.env.ADMIN_PASSWORD!,
    },

    services: {
      openaiApiKey: process.env.OPENAI_API_KEY!,
    },

    logging: {
      logDir: process.env.LOG_DIR,
      logFile: process.env.LOG_FILE,
      logToFile: process.env.LOG_TO_FILE !== 'false',
    },
  };
}

// Export singleton instance
let _config: EnvironmentConfig | null = null;

export const config = {
  get database() {
    return getConfig().database;
  },
  get app() {
    return getConfig().app;
  },
  get auth() {
    return getConfig().auth;
  },
  get services() {
    return getConfig().services;
  },
  get logging() {
    return getConfig().logging;
  },
};

function getConfig(): EnvironmentConfig {
  if (!_config) {
    _config = createEnvironmentConfig();
  }
  return _config;
}

// For testing purposes
export function resetConfig(): void {
  _config = null;
}

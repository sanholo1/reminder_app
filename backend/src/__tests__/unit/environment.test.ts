import { validateEnvironment, createEnvironmentConfig, resetConfig } from '../../config/environment';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    resetConfig();
  });

  afterAll(() => {
    process.env = originalEnv;
    resetConfig();
  });

  describe('validateEnvironment', () => {
    it('should pass validation with all required variables set', () => {
      // Setup required env vars
      process.env.DB_HOST = 'localhost';
      process.env.DB_USERNAME = 'test_user';
      process.env.DB_PASSWORD = 'test_password';
      process.env.DB_DATABASE = 'test_db';
      process.env.JWT_SECRET = 'test_jwt_secret_key_that_is_long_enough_for_validation';
      process.env.ADMIN_USER = 'test_admin';
      process.env.ADMIN_PASSWORD = 'test_admin_password';
      process.env.OPENAI_API_KEY = 'test_openai_key';

      expect(() => validateEnvironment()).not.toThrow();
    });

    it('should throw error when required variables are missing', () => {
      delete process.env.DB_HOST;
      delete process.env.JWT_SECRET;

      expect(() => validateEnvironment()).toThrow(
        'Missing required environment variables: DB_HOST, JWT_SECRET'
      );
    });

    it('should throw error when JWT_SECRET is too short', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_USERNAME = 'test_user';
      process.env.DB_PASSWORD = 'test_password';
      process.env.DB_DATABASE = 'test_db';
      process.env.JWT_SECRET = 'short_secret'; // Less than 32 characters
      process.env.ADMIN_USER = 'test_admin';
      process.env.ADMIN_PASSWORD = 'test_admin_password';
      process.env.OPENAI_API_KEY = 'test_openai_key';

      expect(() => validateEnvironment()).toThrow(
        'JWT_SECRET should be at least 32 characters long for security'
      );
    });

    it('should throw error when ADMIN_PASSWORD is too short', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_USERNAME = 'test_user';
      process.env.DB_PASSWORD = 'test_password';
      process.env.DB_DATABASE = 'test_db';
      process.env.JWT_SECRET = 'test_jwt_secret_key_that_is_long_enough_for_validation';
      process.env.ADMIN_USER = 'test_admin';
      process.env.ADMIN_PASSWORD = 'short'; // Less than 8 characters
      process.env.OPENAI_API_KEY = 'test_openai_key';

      expect(() => validateEnvironment()).toThrow(
        'ADMIN_PASSWORD should be at least 8 characters long'
      );
    });

    it('should throw error when DB_PORT is not a number', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = 'not_a_number';
      process.env.DB_USERNAME = 'test_user';
      process.env.DB_PASSWORD = 'test_password';
      process.env.DB_DATABASE = 'test_db';
      process.env.JWT_SECRET = 'test_jwt_secret_key_that_is_long_enough_for_validation';
      process.env.ADMIN_USER = 'test_admin';
      process.env.ADMIN_PASSWORD = 'test_admin_password';
      process.env.OPENAI_API_KEY = 'test_openai_key';

      expect(() => validateEnvironment()).toThrow(
        'DB_PORT must be a valid number'
      );
    });
  });

  describe('createEnvironmentConfig', () => {
    beforeEach(() => {
      // Setup valid env vars
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '3306';
      process.env.DB_USERNAME = 'test_user';
      process.env.DB_PASSWORD = 'test_password';
      process.env.DB_DATABASE = 'test_db';
      process.env.PORT = '3001';
      process.env.NODE_ENV = 'test';
      process.env.JWT_SECRET = 'test_jwt_secret_key_that_is_long_enough_for_validation';
      process.env.ADMIN_USER = 'test_admin';
      process.env.ADMIN_PASSWORD = 'test_admin_password';
      process.env.OPENAI_API_KEY = 'test_openai_key';
    });

    it('should create correct configuration object', () => {
      const config = createEnvironmentConfig();

      expect(config).toEqual({
        database: {
          host: 'localhost',
          port: 3306,
          username: 'test_user',
          password: 'test_password',
          database: 'test_db',
        },
        app: {
          port: 3001,
          nodeEnv: 'test',
        },
        auth: {
          jwtSecret: 'test_jwt_secret_key_that_is_long_enough_for_validation',
          adminUser: 'test_admin',
          adminPassword: 'test_admin_password',
        },
        services: {
          openaiApiKey: 'test_openai_key',
        },
        logging: {
          logDir: undefined,
          logFile: undefined,
          logToFile: true,
        },
      });
    });

    it('should use default values for optional variables', () => {
      delete process.env.DB_PORT;
      delete process.env.PORT;
      delete process.env.NODE_ENV;

      const config = createEnvironmentConfig();

      expect(config.database.port).toBe(3306);
      expect(config.app.port).toBe(3001);
      expect(config.app.nodeEnv).toBe('development');
    });

    it('should handle logging configuration correctly', () => {
      process.env.LOG_DIR = '/custom/logs';
      process.env.LOG_FILE = 'custom.log';
      process.env.LOG_TO_FILE = 'false';

      const config = createEnvironmentConfig();

      expect(config.logging.logDir).toBe('/custom/logs');
      expect(config.logging.logFile).toBe('custom.log');
      expect(config.logging.logToFile).toBe(false);
    });
  });
});
import { resetConfig } from '../config/environment';

// Setup for tests
beforeAll(async () => {
  // Set test environment variables if not already set
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
  }

  // Mock required environment variables for tests
  if (!process.env.DB_HOST) {
    process.env.DB_HOST = 'localhost';
  }
  if (!process.env.DB_USERNAME) {
    process.env.DB_USERNAME = 'test_user';
  }
  if (!process.env.DB_PASSWORD) {
    process.env.DB_PASSWORD = 'test_password';
  }
  if (!process.env.DB_DATABASE) {
    process.env.DB_DATABASE = 'test_db';
  }
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test_jwt_secret_key_that_is_long_enough_for_validation';
  }
  if (!process.env.ADMIN_USER) {
    process.env.ADMIN_USER = 'test_admin';
  }
  if (!process.env.ADMIN_PASSWORD) {
    process.env.ADMIN_PASSWORD = 'test_admin_password';
  }
  if (!process.env.OPENAI_API_KEY) {
    process.env.OPENAI_API_KEY = 'test_openai_key';
  }

  // Reset config to use test environment variables
  resetConfig();
});

afterAll(async () => {
  // Cleanup after all tests
});

// Global test helpers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidDate(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeValidDate(received: any) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid date`,
        pass: false,
      };
    }
  },
});

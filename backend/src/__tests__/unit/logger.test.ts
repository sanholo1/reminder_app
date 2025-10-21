import fs from 'fs';
import path from 'path';

// Mock fs module before importing logger
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

// Mock console methods before importing logger
const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock the console object
Object.defineProperty(global, 'console', {
  value: mockConsole,
  writable: true,
});

// Now import logger after mocks are set up
import { logger } from '../../utils/logger';

describe('Logger', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Mock fs methods
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.mkdirSync.mockImplementation();
    mockedFs.appendFile.mockImplementation((path, data, callback) => {
      // Call callback immediately to simulate successful write
      if (typeof callback === 'function') {
        callback(null);
      }
    });

    // Clear environment variables
    delete process.env.NODE_ENV;
    delete process.env.LOG_DIR;
    delete process.env.LOG_FILE;
    delete process.env.LOG_TO_FILE;
  });

  describe('debug logging', () => {
    it('should log debug messages in non-production environment', () => {
      process.env.NODE_ENV = 'development';
      
      logger.debug('Test debug message');
      
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] Test debug message')
      );
    });

    it('should not log debug messages in production environment', () => {
      process.env.NODE_ENV = 'production';
      
      logger.debug('Test debug message');
      
      expect(mockConsole.debug).not.toHaveBeenCalled();
    });

    it('should include metadata in debug logs', () => {
      process.env.NODE_ENV = 'development';
      
      logger.debug('Test message', { userId: '123', action: 'login' });
      
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('Test message | {"userId":"123","action":"login"}')
      );
    });
  });

  describe('info logging', () => {
    it('should always log info messages', () => {
      logger.info('Test info message');
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Test info message')
      );
    });

    it('should include metadata in info logs', () => {
      logger.info('Server started', { port: 3001 });
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Server started | {"port":3001}')
      );
    });
  });

  describe('warn logging', () => {
    it('should log warning messages', () => {
      logger.warn('Test warning message');
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Test warning message')
      );
    });
  });

  describe('error logging', () => {
    it('should log error messages', () => {
      logger.error('Test error message');
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Test error message')
      );
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error');
      logger.error('An error occurred', { error: error.message });
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('An error occurred | {"error":"Test error"}')
      );
    });
  });

  describe('file logging', () => {
    it('should write to file when LOG_TO_FILE is not false', () => {
      // Explicitly set LOG_TO_FILE to enable file logging
      process.env.LOG_TO_FILE = 'true';
      
      logger.info('Test message');
      
      expect(mockedFs.appendFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('[INFO] Test message'),
        expect.any(Function)
      );
    });

    it('should not write to file when LOG_TO_FILE is false', () => {
      process.env.LOG_TO_FILE = 'false';
      
      logger.info('Test message');
      
      expect(mockedFs.appendFile).not.toHaveBeenCalled();
    });

    it('should create log directory if it does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);
      process.env.LOG_DIR = '/custom/logs';
      process.env.LOG_TO_FILE = 'true';
      
      logger.info('Test message');
      
      expect(mockedFs.mkdirSync).toHaveBeenCalledWith(
        '/custom/logs',
        { recursive: true }
      );
    });

    it('should use custom log file name', () => {
      process.env.LOG_FILE = 'custom.log';
      process.env.LOG_DIR = '/logs';
      process.env.LOG_TO_FILE = 'true';
      
      logger.info('Test message');
      
      expect(mockedFs.appendFile).toHaveBeenCalledWith(
        '/logs/custom.log',
        expect.any(String),
        expect.any(Function)
      );
    });
  });

  describe('message formatting', () => {
    it('should include timestamp in log messages', () => {
      logger.info('Test message');
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
      );
    });

    it('should handle non-string messages', () => {
      const objectMessage = { test: 'value' };
      logger.info(objectMessage);
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[object Object]')
      );
    });

    it('should handle null and undefined messages', () => {
      logger.info(null);
      logger.info(undefined);
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('null')
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('undefined')
      );
    });
  });
});
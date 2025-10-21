import request from 'supertest';
import express from 'express';
import healthRouter from '../../routes/health';
import { AppDataSource } from '../../config/database';

// Mock the database
jest.mock('../../config/database', () => ({
  AppDataSource: {
    query: jest.fn(),
  },
}));

// Mock the config
jest.mock('../../config/environment', () => ({
  config: {
    app: {
      nodeEnv: 'test',
    },
  },
}));

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Health Routes', () => {
  let app: express.Application;
  const mockQuery = AppDataSource.query as jest.MockedFunction<typeof AppDataSource.query>;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/', healthRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return healthy status when database is accessible', async () => {
      mockQuery.mockResolvedValueOnce([{ '1': 1 }]);

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        environment: 'test',
        checks: {
          database: {
            status: 'connected',
          },
          memory: {
            used: expect.any(Number),
            total: expect.any(Number),
            percentage: expect.any(Number),
          },
        },
      });

      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
      expect(response.body.checks.database.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should return error status when database is not accessible', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/health')
        .expect(503);

      expect(response.body).toMatchObject({
        status: 'error',
        environment: 'test',
        checks: {
          database: {
            status: 'disconnected',
            error: 'Database connection failed',
          },
        },
      });
    });

    it('should include memory usage information', async () => {
      mockQuery.mockResolvedValueOnce([{ '1': 1 }]);

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.checks.memory).toEqual({
        used: expect.any(Number),
        total: expect.any(Number),
        percentage: expect.any(Number),
      });

      expect(response.body.checks.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(response.body.checks.memory.percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('GET /health/live', () => {
    it('should always return alive status', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'alive',
        timestamp: expect.any(String),
      });

      // Verify timestamp is valid ISO string
      expect(new Date(response.body.timestamp)).toBeValidDate();
    });
  });

  describe('GET /health/ready', () => {
    it('should return ready status when database is accessible', async () => {
      mockQuery.mockResolvedValueOnce([{ '1': 1 }]);

      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ready',
        timestamp: expect.any(String),
      });
    });

    it('should return not-ready status when database is not accessible', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/health/ready')
        .expect(503);

      expect(response.body).toMatchObject({
        status: 'not-ready',
        timestamp: expect.any(String),
        reason: 'Database not accessible',
      });
    });
  });
});
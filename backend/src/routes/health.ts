import express, { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

const router = express.Router();

interface HealthCheckResponse {
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
    disk?: {
      available: boolean;
    };
  };
}

/**
 * Health check endpoint
 * GET /health
 * Returns application health status including database connectivity
 */
router.get('/health', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const healthCheck: HealthCheckResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.app.nodeEnv,
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: {
          status: 'disconnected',
        },
        memory: {
          used: 0,
          total: 0,
          percentage: 0,
        },
      },
    };

    // Check database connectivity
    try {
      const dbStartTime = Date.now();
      await AppDataSource.query('SELECT 1');
      const dbResponseTime = Date.now() - dbStartTime;

      healthCheck.checks.database = {
        status: 'connected',
        responseTime: dbResponseTime,
      };
    } catch (dbError: any) {
      healthCheck.status = 'error';
      healthCheck.checks.database = {
        status: 'disconnected',
        error: dbError.message,
      };

      logger.error('Database health check failed', { error: dbError.message });
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    healthCheck.checks.memory = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    };

    // Log successful health check
    if (healthCheck.status === 'ok') {
      logger.debug('Health check passed', {
        responseTime: Date.now() - startTime,
        dbResponseTime: healthCheck.checks.database.responseTime,
      });
    }

    // Return appropriate HTTP status
    const httpStatus = healthCheck.status === 'ok' ? 200 : 503;
    res.status(httpStatus).json(healthCheck);
  } catch (error: any) {
    logger.error('Health check endpoint error', { error: error.message });

    const errorResponse: HealthCheckResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.app.nodeEnv,
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: {
          status: 'disconnected',
          error: 'Health check failed',
        },
        memory: {
          used: 0,
          total: 0,
          percentage: 0,
        },
      },
    };

    res.status(503).json(errorResponse);
  }
});

/**
 * Simple liveness probe
 * GET /health/live
 * Returns 200 if application is running
 */
router.get('/health/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness probe
 * GET /health/ready
 * Returns 200 if application is ready to serve traffic
 */
router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    // Check if database is accessible
    await AppDataSource.query('SELECT 1');

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.warn('Readiness check failed', { error: error.message });
    res.status(503).json({
      status: 'not-ready',
      timestamp: new Date().toISOString(),
      reason: 'Database not accessible',
    });
  }
});

export default router;

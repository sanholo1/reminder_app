import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import reminderRouter from './controllers/reminder_controller';
import authRouter from './controllers/auth_controller';
import healthRouter from './routes/health';
import { AppDataSource } from './config/database';
import { config } from './config/environment';
import { SessionMiddleware } from './middleware/session_middleware';
import { requestLogger } from './middleware/request_logger';
import { logger } from './utils/logger';
import {
  ValidationError,
  HttpError,
  BadRequestError,
  ForbiddenError,
  AbuseError,
  DatabaseConnectionError,
  DatabaseQueryError,
  DatabaseTimeoutError
} from './exceptions/exception_handler';

const application = express();
const sessionMiddleware = new SessionMiddleware();

application.use(cors());
application.use(express.json());
application.use(requestLogger);

// Health routes (no auth or session required)
application.use('/', healthRouter);

application.use(sessionMiddleware.extractSessionId);
application.use(sessionMiddleware.checkBlocked);

application.use('/auth', authRouter);
application.use('/', reminderRouter);
application.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error handler called', { error: (err && err.message) || String(err) });
  if (err instanceof AbuseError) {
    return res.status(err.status).json({ error: err.message, status: err.status, name: err.name });
  }
  if (err instanceof ForbiddenError) {
    return res.status(err.status).json({ error: err.message, status: err.status, name: err.name });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, status: err.status, name: err.name });
  }
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message, status: 400, name: err.name });
  }
  if (err instanceof DatabaseConnectionError) {
    return res.status(503).json({ error: err.message, status: 503, name: err.name });
  }
  if (err instanceof DatabaseQueryError) {
    return res.status(500).json({ error: err.message, status: 500, name: err.name });
  }
  if (err instanceof DatabaseTimeoutError) {
    return res.status(504).json({ error: err.message, status: 504, name: err.name });
  }
  logger.error('Unhandled error', { error: (err && err.message) || String(err) });
  res.status(500).json({ error: 'Internal Server Error', status: 500 });
});

AppDataSource.initialize()
  .then(() => {
    logger.info('Database connection established successfully');
    application.listen(config.app.port, () => {
      logger.info('Server is running', { port: config.app.port });
    });
  })
  .catch((error) => {
    logger.error('Error during database initialization', { error: (error && error.message) || String(error) });
    
    if (error.code === 'ECONNREFUSED') {
      logger.error('Database connection refused. Make sure database is running.');
    } else if (error.code === 'ENOTFOUND') {
      logger.error('Database host not found. Check database configuration.');
    } else if (error.code === 'ETIMEDOUT') {
      logger.error('Database connection timeout. Check network connection.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      logger.error('Database access denied. Check username and password.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      logger.error('Database does not exist. Create the database first.');
    }
    
    
    logger.warn('Retrying database connection in 5 seconds...');
    setTimeout(() => {
      logger.info('Retrying database connection...');
      AppDataSource.initialize()
        .then(() => {
          logger.info('Database connection established successfully on retry');
          application.listen(config.app.port, () => {
            logger.info('Server is running', { port: config.app.port });
          });
        })
        .catch((retryError) => {
          logger.error('Database connection failed on retry', { error: (retryError && retryError.message) || String(retryError) });
          logger.error('Server will exit. Please check database configuration.');
          process.exit(1);
        });
    }, 5000);
  }); 






import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import reminderRouter from './controllers/reminder_controller';
import { AppDataSource } from './config/database';
import { SessionMiddleware } from './middleware/session_middleware';
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
const applicationPort = process.env.PORT || 3001;
const sessionMiddleware = new SessionMiddleware();

application.use(cors());
application.use(express.json());

// Session middleware
application.use(sessionMiddleware.extractSessionId);
application.use(sessionMiddleware.checkBlocked);

application.use('/', reminderRouter);
application.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log('Error handler called with:', err);
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
  console.log('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error', status: 500 });
});

AppDataSource.initialize()
  .then(() => {
    console.log("Database connection established successfully");
    application.listen(applicationPort, () => {
      console.log(`Server is running on port ${applicationPort}`);
    });
  })
  .catch((error) => {
    console.error("Error during database initialization:", error);
    
    // Sprawdź typ błędu bazy danych
    if (error.code === 'ECONNREFUSED') {
      console.error("Database connection refused. Make sure database is running.");
    } else if (error.code === 'ENOTFOUND') {
      console.error("Database host not found. Check database configuration.");
    } else if (error.code === 'ETIMEDOUT') {
      console.error("Database connection timeout. Check network connection.");
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error("Database access denied. Check username and password.");
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error("Database does not exist. Create the database first.");
    }
    
    // Próba ponownego połączenia po 5 sekundach
    console.log("Retrying database connection in 5 seconds...");
    setTimeout(() => {
      console.log("Retrying database connection...");
      AppDataSource.initialize()
        .then(() => {
          console.log("Database connection established successfully on retry");
          application.listen(applicationPort, () => {
            console.log(`Server is running on port ${applicationPort}`);
          });
        })
        .catch((retryError) => {
          console.error("Database connection failed on retry:", retryError);
          console.error("Server will exit. Please check database configuration.");
          process.exit(1);
        });
    }, 5000);
  }); 






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
  AbuseError
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
    process.exit(1);
  }); 






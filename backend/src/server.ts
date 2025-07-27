import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import "reflect-metadata";
import reminderRouter from './controllers/reminder_controller';
import { AppDataSource } from './config/database';
import { 
  ValidationError, 
  HttpError,
  BadRequestError, 
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  MethodNotAllowedError,
  ConflictError,
  UnprocessableEntityError,
  TooManyRequestsError,
  InternalServerError,
  ServiceUnavailableError
} from './exceptions/exception_handler';

const application = express();
const applicationPort = 3001;

application.use(cors());
application.use(express.json());
application.use('/', reminderRouter);
application.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', err);
  
  // Handle all HTTP errors
  if (err instanceof HttpError) {
    return res.status(err.status).json({ 
      error: err.message,
      status: err.status,
      name: err.name 
    });
  }
  
  // Handle validation errors
  if (err instanceof ValidationError) {
    return res.status(400).json({ 
      error: err.message,
      status: 400,
      name: err.name 
    });
  }
  
  // Handle unknown errors
  res.status(500).json({ 
    error: 'Błąd serwera', 
    status: 500,
    name: 'InternalServerError',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Inicjalizacja TypeORM
AppDataSource.initialize()
  .then(() => {
    console.log("Połączenie z bazą danych zostało zainicjalizowane");
    
    application.listen(applicationPort, async () => {
      console.log(`Serwer uruchomiony na porcie ${applicationPort}`);
      console.log(`Endpoint tworzenia: POST http://localhost:${applicationPort}/reminders`);
      console.log(`Endpoint pobierania: GET http://localhost:${applicationPort}/reminders`);
    });
  })
  .catch((error) => {
    console.error("Błąd podczas inicjalizacji bazy danych:", error);
  }); 






import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import "reflect-metadata";
import reminderRouter from './controllers/reminder_controller';
import { AppDataSource } from './config/database';

class NotFoundError extends Error {
  status: number;
  constructor(message: string = 'Nie znaleziono zasobu') {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

class BadRequestError extends Error {
  status: number;
  constructor(message: string = 'Błędne żądanie') {
    super(message);
    this.name = 'BadRequestError';
    this.status = 400;
  }
}

export { NotFoundError, BadRequestError };

const application = express();
const applicationPort = 3001;

application.use(cors());
application.use(express.json());
application.use('/', reminderRouter);
application.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', err);
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }
  if (err instanceof BadRequestError) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Błąd serwera', details: err.message || err.toString() });
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






import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import reminderRouter from './controllers/reminder_controller';
import {
  ValidationError,
  HttpError,
  BadRequestError
} from './exceptions/exception_handler';

const application = express();
const applicationPort = 3001;

application.use(cors());
application.use(express.json());
application.use('/', reminderRouter);
application.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, status: err.status, name: err.name });
  }
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message, status: 400, name: err.name });
  }
  res.status(500).json({ error: 'Internal Server Error', status: 500 });
});

application.listen(applicationPort); 






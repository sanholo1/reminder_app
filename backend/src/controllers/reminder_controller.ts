import { Request, Response, Router, NextFunction } from 'express';
import { CreateReminderHandler } from '../commands/create_command';
import { GetRemindersHandler } from '../queries/get_query';
import { NotFoundError, BadRequestError, MethodNotAllowedError } from '../exceptions/exception_handler';

const reminderRouter = Router();
const createReminderHandler = new CreateReminderHandler();
const getRemindersHandler = new GetRemindersHandler();

reminderRouter.post('/reminders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await createReminderHandler.execute({ text: req.body.text });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

reminderRouter.get('/reminders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getRemindersHandler.execute({});
    res.json(result);
  } catch (error) {
    next(error);
  }
});

reminderRouter.get('/reminders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new BadRequestError('Brak identyfikatora przypomnienia');
    }
    throw new NotFoundError('Przypomnienie o podanym identyfikatorze nie istnieje');
  } catch (error) {
    next(error);
  }
});

reminderRouter.put('/reminders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    throw new MethodNotAllowedError('Aktualizacja przypomnień nie jest jeszcze zaimplementowana');
  } catch (error) {
    next(error);
  }
});

reminderRouter.delete('/reminders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    throw new MethodNotAllowedError('Usuwanie przypomnień nie jest jeszcze zaimplementowane');
  } catch (error) {
    next(error);
  }
});

export default reminderRouter; 
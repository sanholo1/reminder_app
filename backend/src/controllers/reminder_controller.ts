import { Request, Response, Router, NextFunction } from 'express';
import { CreateHandler } from '../commands/create_command';
import { GetHandler } from '../queries/get_query';
import { NotFoundError, BadRequestError } from '../server';

const reminderRouter = Router();
const createReminderHandler = new CreateHandler();
const getRemindersHandler = new GetHandler();

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

reminderRouter.put('/reminders/:id', async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

reminderRouter.delete('/reminders/:id', async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

export default reminderRouter; 
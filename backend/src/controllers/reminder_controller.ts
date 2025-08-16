import { Request, Response, Router, NextFunction } from 'express';
import { CreateReminderHandler } from '../commands/create_command';
import { GetRemindersHandler } from '../queries/get_query';
import { DeleteReminderHandler } from '../commands/delete_command';
import { NotFoundError, BadRequestError, MethodNotAllowedError } from '../exceptions/exception_handler';

const reminderRouter = Router();
const createReminderHandler = new CreateReminderHandler();
const getRemindersHandler = new GetRemindersHandler();
const deleteReminderHandler = new DeleteReminderHandler();

reminderRouter.post('/reminders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = (req as any).sessionId;
    const result = await createReminderHandler.execute({ 
      text: req.body.text,
      sessionId: sessionId
    });
    
    // Check if it's an abuse result
    if ('isBlocked' in result && 'remainingAttempts' in result) {
      const abuseResult = result as any;
      
      // Set headers
      res.setHeader('X-Remaining-Attempts', abuseResult.remainingAttempts.toString());
      
      if (abuseResult.isBlocked) {
        return res.status(403).json({
          error: abuseResult.error,
          status: 403,
          name: 'AbuseError'
        });
      } else {
        return res.status(403).json({
          error: abuseResult.error,
          status: 403,
          name: 'AbuseError'
        });
      }
    }
    
    // Regular success result
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
    if (!id) throw new BadRequestError('Brak identyfikatora przypomnienia');
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
    const { id } = req.params;
    if (!id) throw new BadRequestError('Brak identyfikatora przypomnienia');
    
    const result = await deleteReminderHandler.execute({ id });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default reminderRouter; 
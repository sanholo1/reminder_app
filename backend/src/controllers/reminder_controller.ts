import { Request, Response, Router, NextFunction } from 'express';
import { CreateReminderHandler } from '../commands/create_command';
import { GetRemindersHandler } from '../queries/get_query';
import { DeleteReminderHandler } from '../commands/delete_command';
import { NotFoundError, BadRequestError, MethodNotAllowedError } from '../exceptions/exception_handler';
import { ReminderRepositoryTypeORM } from '../repositories/reminder_repository_typeorm';

const reminderRouter = Router();
const createReminderHandler = new CreateReminderHandler();
const getRemindersHandler = new GetRemindersHandler();
const deleteReminderHandler = new DeleteReminderHandler();
const reminderRepository = new ReminderRepositoryTypeORM();

reminderRouter.post('/reminders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = (req as any).sessionId;
    const result = await createReminderHandler.execute({ 
      text: req.body.text,
      sessionId: sessionId,
      category: req.body.category || null
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

// Get all categories
reminderRouter.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await reminderRepository.getCategories();
    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

// Get reminders by category
reminderRouter.get('/reminders/category/:category', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    if (!category) throw new BadRequestError('Brak nazwy kategorii');
    
    const reminders = await reminderRepository.findByCategory(category);
    res.json({ reminders });
  } catch (error) {
    next(error);
  }
});

// Delete category and all its reminders
reminderRouter.delete('/categories/:category', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    if (!category) throw new BadRequestError('Brak nazwy kategorii');
    
    const deletedCount = await reminderRepository.deleteByCategory(category);
    res.json({ 
      message: `Usunięto kategorię "${category}" wraz z ${deletedCount} przypomnieniami`,
      deletedCount 
    });
  } catch (error) {
    next(error);
  }
});

// Get trash items
reminderRouter.get('/trash', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trashItems = await reminderRepository.getTrashItems();
    res.json({ trashItems });
  } catch (error) {
    next(error);
  }
});

// Restore item from trash
reminderRouter.post('/trash/:id/restore', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) throw new BadRequestError('Brak identyfikatora elementu');
    
    await reminderRepository.restoreFromTrash(id);
    res.json({ message: 'Przypomnienie zostało przywrócone' });
  } catch (error) {
    next(error);
  }
});

export default reminderRouter; 
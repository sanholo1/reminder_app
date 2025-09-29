import { Request, Response, Router, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth_middleware';
import { CreateReminderHandler } from '../commands/create_command';
import { GetRemindersHandler } from '../queries/get_query';
import { DeleteReminderHandler } from '../commands/delete_command';
import { NotFoundError, BadRequestError, MethodNotAllowedError } from '../exceptions/exception_handler';
import { UserSessionService } from '../services/user_session_service';
import { GetActiveRemindersHandler } from '../queries/get_active_reminders_query';
import { GetCategoriesHandler } from '../queries/get_categories_query';
import { GetRemindersByCategoryHandler } from '../queries/get_reminders_by_category_query';
import { GetTrashItemsHandler } from '../queries/get_trash_items_query';
import { RestoreFromTrashHandler } from '../commands/restore_from_trash_command';
import { DeleteCategoryHandler } from '../commands/delete_category_command';
import { UpdateReminderHandler } from '../commands/update_command';
import { logger } from '../utils/logger';

const reminderRouter = Router();
reminderRouter.use(requireAuth);
const createReminderHandler = new CreateReminderHandler();
const getRemindersHandler = new GetRemindersHandler();
const deleteReminderHandler = new DeleteReminderHandler();
const userSessionService = new UserSessionService();
const getActiveRemindersHandler = new GetActiveRemindersHandler();
const getCategoriesHandler = new GetCategoriesHandler();
const getRemindersByCategoryHandler = new GetRemindersByCategoryHandler();
const getTrashItemsHandler = new GetTrashItemsHandler();
const restoreFromTrashHandler = new RestoreFromTrashHandler();
const deleteCategoryHandler = new DeleteCategoryHandler();
const updateReminderHandler = new UpdateReminderHandler();

reminderRouter.post('/reminders', async (req: Request, res: Response, next: NextFunction) => {
  try {
  const sessionId = (req as any).sessionId;
  const userId = (req as any).user?.sub || '';
    const result = await createReminderHandler.execute({ 
      text: req.body.text,
      sessionId: sessionId,
      userId: userId,
      category: req.body.category || null
    });
    
    if ('isBlocked' in result && 'remainingAttempts' in result) {
      const abuseResult = result as any;
      
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
    
    if (sessionId) {
      try {
        const usageInfo = await userSessionService.getUsageInfo(sessionId);
        res.setHeader('X-Daily-Usage-Count', usageInfo.dailyUsageCount.toString());
        res.setHeader('X-Daily-Max-Usage', usageInfo.maxDailyUsage.toString());
        res.setHeader('X-Daily-Remaining-Usage', usageInfo.remainingDailyUsage.toString());
      } catch (error) {
        logger.warn('Error getting usage info for headers', { error: (error as any)?.message || String(error), sessionId });
      }
    }
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

reminderRouter.get('/reminders', async (req: Request, res: Response, next: NextFunction) => {
  try {
  const userId = (req as any).user?.sub || '';
    const result = await getRemindersHandler.execute({ userId });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

reminderRouter.get('/reminders/active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let sessionId = (req as any).sessionId;
    if (!sessionId) {
      logger.warn('No session ID provided, using default');
      sessionId = 'default-session';
    }
    const result = await getActiveRemindersHandler.execute({ sessionId });
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
    const { id } = req.params;
    if (!id) throw new BadRequestError('Brak identyfikatora przypomnienia');
    const { activity, datetime, category } = req.body || {};
    const result = await updateReminderHandler.execute({ id, activity, datetime, category });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

reminderRouter.delete('/reminders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
  const { id } = req.params;
  if (!id) throw new BadRequestError('Brak identyfikatora przypomnienia');
  const userId = (req as any).user?.sub || '';
  const result = await deleteReminderHandler.execute({ id, userId });
  res.json(result);
  } catch (error) {
    next(error);
  }
});

reminderRouter.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getCategoriesHandler.execute({});
    res.json(result);
  } catch (error) {
    next(error);
  }
});

reminderRouter.get('/reminders/category/:category', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    if (!category) throw new BadRequestError('Brak nazwy kategorii');
    const result = await getRemindersByCategoryHandler.execute({ category });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

reminderRouter.delete('/categories/:category', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    if (!category) throw new BadRequestError('Brak nazwy kategorii');
    const result = await deleteCategoryHandler.execute({ category });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

reminderRouter.get('/trash', async (req: Request, res: Response, next: NextFunction) => {
  try {
  const userId = (req as any).user?.sub || '';
    const result = await getTrashItemsHandler.execute({ userId });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

reminderRouter.post('/trash/:id/restore', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) throw new BadRequestError('Brak identyfikatora elementu');
    const result = await restoreFromTrashHandler.execute({ id });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

reminderRouter.get('/usage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = (req as any).sessionId;
    if (!sessionId) {
      return res.status(401).json({ error: 'Brak identyfikatora sesji' });
    }
    
    const usageInfo = await userSessionService.getUsageInfo(sessionId);
    res.json(usageInfo);
  } catch (error) {
    next(error);
  }
});

export default reminderRouter; 
import { Request, Response, NextFunction } from 'express';
import { UserSessionService } from '../services/user_session_service';
import { ForbiddenError } from '../exceptions/exception_handler';

export class SessionMiddleware {
  private userSessionService = new UserSessionService();

  extractSessionId = (req: Request, res: Response, next: NextFunction) => {
    // Try to get session ID from various sources
    let sessionId = req.headers['x-session-id'] as string;
    
    if (!sessionId) {
      // Try to get from cookies
      sessionId = req.cookies?.sessionId;
    }
    
    if (!sessionId) {
      // Try to get from query parameters
      sessionId = req.query.sessionId as string;
    }
    
    if (!sessionId) {
      // Generate a new session ID based on IP and user agent
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      sessionId = Buffer.from(`${ip}-${userAgent}`).toString('base64').substring(0, 32);
    }
    
    (req as any).sessionId = sessionId;
    next();
  };

  checkBlocked = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = (req as any).sessionId;
      if (!sessionId) {
        return next();
      }

      const blockStatus = await this.userSessionService.checkIfBlocked(sessionId);
      
      if (blockStatus.isBlocked && blockStatus.blockedUntil) {
        const blockedUntil = new Date(blockStatus.blockedUntil);
        const now = new Date();
        const remainingTime = Math.ceil((blockedUntil.getTime() - now.getTime()) / (1000 * 60 * 60)); // hours
        
        throw new ForbiddenError(
          `Twoje konto zostało zablokowane na 24 godziny z powodu nieprawidłowego użycia. Pozostało ${remainingTime} godzin.`
        );
      }
      
      // Add remaining attempts to response headers
      res.setHeader('X-Remaining-Attempts', blockStatus.remainingAttempts.toString());
      
      next();
    } catch (error) {
      next(error);
    }
  };

  recordAttempt = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = (req as any).sessionId;
      if (!sessionId) {
        return next();
      }

      // Check if this is a reminder creation request
      const isReminderRequest = req.path === '/reminders' && req.method === 'POST';
      
      if (isReminderRequest) {
        const text = req.body?.text || '';
        const isOffTopic = await this.isOffTopicRequest(text);
        
        const attemptResult = await this.userSessionService.recordAttempt(sessionId, isOffTopic);
        
        // Update response headers
        res.setHeader('X-Remaining-Attempts', attemptResult.remainingAttempts.toString());
        
        if (isOffTopic) {
          if (attemptResult.isBlocked) {
            throw new ForbiddenError(
              'Twoje konto zostało zablokowane na 24 godziny z powodu nieprawidłowego użycia.'
            );
          } else {
            // Add warning message to response
            res.setHeader('X-Warning', `Pozostało ${attemptResult.remainingAttempts} prób przed zablokowaniem. Używaj aplikacji tylko do tworzenia przypomnień.`);
          }
        }
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };

  recordAttemptForRequest = async (req: Request, res: Response): Promise<void> => {
    const sessionId = (req as any).sessionId;
    if (!sessionId) {
      return;
    }

    // Check if this is a reminder creation request
    const isReminderRequest = req.path === '/reminders' && req.method === 'POST';
    
    if (isReminderRequest) {
      const text = req.body?.text || '';
      const isOffTopic = await this.isOffTopicRequest(text);
      
      const attemptResult = await this.userSessionService.recordAttempt(sessionId, isOffTopic);
      
      // Update response headers
      res.setHeader('X-Remaining-Attempts', attemptResult.remainingAttempts.toString());
      
      if (isOffTopic) {
        if (attemptResult.isBlocked) {
          throw new ForbiddenError(
            'Twoje konto zostało zablokowane na 24 godziny z powodu nieprawidłowego użycia.'
          );
        } else {
          // Add warning message to response
          res.setHeader('X-Warning', `Pozostało ${attemptResult.remainingAttempts} prób przed zablokowaniem. Używaj aplikacji tylko do tworzenia przypomnień.`);
          // Return early to prevent processing by LLM parser
          throw new ForbiddenError(
            `To pytanie nie dotyczy tworzenia przypomnień. Używaj aplikacji tylko do ustawiania przypomnień. Pozostało ${attemptResult.remainingAttempts} prób przed zablokowaniem.`
          );
        }
      }
    }
  };

  private async isOffTopicRequest(text: string): Promise<boolean> {
    if (!text || text.trim().length === 0) {
      return false;
    }

    const lowerText = text.toLowerCase();
    
    // Check for reminder-related keywords
    const reminderKeywords = [
      'przypomnij', 'przypomnienie', 'przypomnieć', 'przypomnieć mi',
      'za', 'jutro', 'dziś', 'dzisiaj', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela',
      'godzin', 'minut', 'tydzień', 'tygodni',
      'spotkanie', 'zadzwoń', 'zadzwonić', 'kup', 'kupić', 'wyjdź', 'wyjść', 'sprawdź', 'sprawdzić',
      'podlej', 'podlać', 'wyprowadź', 'wyprowadzić', 'odkurz', 'odkurzyć', 'narysuj', 'narysować'
    ];

    const hasReminderKeywords = reminderKeywords.some(keyword => 
      lowerText.includes(keyword)
    );

    // Check for time patterns
    const timePatterns = [
      /\d{1,2}:\d{2}/, // HH:MM
      /\d{1,2} godzin/, // X godzin
      /\d+ minut/, // X minut
      /za \d+/, // za X
      /jutro/, // jutro
      /dziś|dzisiaj/, // dziś/dzisiaj
      /poniedziałek|wtorek|środa|czwartek|piątek|sobota|niedziela/, // days of week
      /tydzień/ // tydzień
    ];

    const hasTimePattern = timePatterns.some(pattern => 
      pattern.test(lowerText)
    );

    // If it has reminder keywords or time patterns, it's likely on-topic
    if (hasReminderKeywords || hasTimePattern) {
      return false;
    }

    // Check for obvious off-topic content
    const offTopicKeywords = [
      'jak się masz', 'jak sie masz', 'co słychać', 'co slychac', 'opowiedz mi', 'opowiedz mi', 'pogadajmy', 'rozmawiajmy',
      'opowiedz żart', 'opowiedz zart', 'żart', 'zart', 'dowcip', 'historia', 'opowiadanie',
      'pomóż mi', 'pomoz mi', 'pomoc', 'radź', 'radz', 'porada', 'sugestia',
      'co myślisz', 'co myslisz', 'twoja opinia', 'twoje zdanie',
      'wyjaśnij', 'wyjasnij', 'wytłumacz', 'wytlumacz', 'co to znaczy',
      'napisz', 'stwórz', 'stworz', 'wygeneruj', 'utwórz tekst', 'utworz tekst',
      'przetłumacz', 'przetlumacz', 'tłumaczenie', 'tlumaczenie', 'translate',
      'oblicz', 'matematyka', 'matematyczny',
      'programowanie', 'kod', 'kodowanie',
      'filozofia', 'filozoficzne', 'egzystencjalne',
      'polityka', 'polityczne', 'społeczne', 'spoleczne',
      'religia', 'religijne', 'duchowe',
      'medycyna', 'lekarz', 'diagnoza', 'choroba',
      'psychologia', 'psychologiczne', 'terapia'
    ];

    const hasOffTopicKeywords = offTopicKeywords.some(keyword => 
      lowerText.includes(keyword)
    );

    return hasOffTopicKeywords;
  }
} 
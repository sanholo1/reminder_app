import { Request, Response, NextFunction } from 'express';
import { UserSessionService } from '../services/user_session_service';
import { ForbiddenError } from '../exceptions/exception_handler';

export class SessionMiddleware {
  private userSessionService = new UserSessionService();

  extractSessionId = (req: Request, res: Response, next: NextFunction) => {
    let sessionId = req.headers['x-session-id'] as string;

    if (!sessionId) {
      sessionId = req.cookies?.sessionId;
    }

    if (!sessionId) {
      sessionId = req.query.sessionId as string;
    }

    if (!sessionId) {
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
        const remainingTime = Math.ceil(
          (blockedUntil.getTime() - now.getTime()) / (1000 * 60 * 60)
        ); // hours

        throw new ForbiddenError(
          `Twoje konto zostało zablokowane na 24 godziny z powodu nieprawidłowego użycia. Pozostało ${remainingTime} godzin.`
        );
      }

      res.setHeader('X-Remaining-Attempts', blockStatus.remainingAttempts.toString());

      next();
    } catch (error) {
      next(error);
    }
  };
}

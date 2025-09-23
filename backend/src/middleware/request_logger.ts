import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, originalUrl } = req;
  const sessionId = (req as any).sessionId;

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const status = res.statusCode;
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    logger[level as 'info' | 'warn' | 'error']('HTTP', {
      method,
      url: originalUrl,
      status,
      durationMs,
      sessionId
    });
  });

  next();
}



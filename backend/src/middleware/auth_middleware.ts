import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Wymagane logowanie' });
  }
  const token = auth.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret) as any;
    (req as any).user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Nieprawidłowy token' });
  }
}

export function extractUserId(req: Request): string | undefined {
  return (req as any).user?.userId;
}

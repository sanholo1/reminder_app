import { Request, Response, Router } from 'express';
import { AppDataSource } from '../config/database';
import { config } from '../config/environment';
import { User } from '../entities/User';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { requireAuth } from '../middleware/auth_middleware';

const router = Router();

// Endpoint do rejestracji nowego użytkownika

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Brak nazwy użytkownika lub hasła' });
    }
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
    }
    const token = jwt.sign({ userId: user.id }, config.auth.jwtSecret, { expiresIn: '24h' });
    return res.json({ token });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Błąd logowania' });
  }
});

router.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  try {
    const userPayload = (req as any).user as { sub: string };
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Brak starego lub nowego hasła' });
    }
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { id: userPayload.sub } });
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    const ok = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Stare hasło nieprawidłowe' });
    }
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await repo.save(user);
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Błąd zmiany hasła' });
  }
});

// Dev-only: reset or create admin according to env
router.post('/dev/reset-admin', async (req: Request, res: Response) => {
  try {
    if (config.app.nodeEnv !== 'development') {
      return res.status(403).json({ error: 'Niedostępne w tym środowisku' });
    }
    const repo = AppDataSource.getRepository(User);
    let user = await repo.findOne({ where: { username: config.auth.adminUser } });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(config.auth.adminPassword, salt);
    if (!user) {
      user = repo.create({ username: config.auth.adminUser, passwordHash });
    } else {
      user.passwordHash = passwordHash;
    }
    await repo.save(user);
    return res.json({ ok: true, username: user.username });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Błąd resetu admina' });
  }
});

export default router;

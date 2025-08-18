import { AppDataSource } from '../config/database';
import { UserSession } from '../entities/UserSession';
import { ForbiddenError, DatabaseConnectionError, DatabaseQueryError } from '../exceptions/exception_handler';

export class UserSessionService {
  private userSessionRepository = AppDataSource.getRepository(UserSession);

  async getOrCreateSession(sessionId: string): Promise<UserSession> {
    try {
      let session = await this.userSessionRepository.findOne({
        where: { sessionId }
      });

      if (!session) {
        session = this.userSessionRepository.create({
          sessionId,
          attempts: 0,
          maxAttempts: 3,
          isBlocked: false,
          blockedUntil: null,
          lastAttempt: null
        });
        await this.userSessionRepository.save(session);
      }

      return session;
    } catch (error) {
      // Type guard - sprawdź czy error ma właściwość code
      if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as { code: string };
        if (dbError.code === 'ECONNREFUSED' || dbError.code === 'ENOTFOUND') {
          throw new DatabaseConnectionError('Błąd połączenia z bazą danych sesji użytkownika');
        }
      }
      throw new DatabaseQueryError('Błąd podczas pobierania sesji użytkownika');
    }
  }

  async checkIfBlocked(sessionId: string): Promise<{ isBlocked: boolean; remainingAttempts: number; blockedUntil?: Date }> {
    try {
      const session = await this.getOrCreateSession(sessionId);
      
      // Check if user is currently blocked
      if (session.isBlocked && session.blockedUntil) {
        const now = new Date();
        if (now < session.blockedUntil) {
          return {
            isBlocked: true,
            remainingAttempts: 0,
            blockedUntil: session.blockedUntil
          };
        } else {
          // Block has expired, reset
          session.isBlocked = false;
          session.blockedUntil = null;
          session.attempts = 0;
          await this.userSessionRepository.save(session);
        }
      }

      return {
        isBlocked: false,
        remainingAttempts: session.maxAttempts - session.attempts
      };
    } catch (error) {
      if (error instanceof DatabaseConnectionError || error instanceof DatabaseQueryError) {
        throw error;
      }
      throw new DatabaseQueryError('Błąd podczas sprawdzania blokady użytkownika');
    }
  }

  async recordAttempt(sessionId: string, isOffTopic: boolean): Promise<{ remainingAttempts: number; isBlocked: boolean; blockedUntil?: Date }> {
    try {
      const session = await this.getOrCreateSession(sessionId);
      
      if (isOffTopic) {
        session.attempts += 1;
        session.lastAttempt = new Date();
        
        if (session.attempts >= session.maxAttempts) {
          // Block user for 24 hours
          session.isBlocked = true;
          session.blockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
        }
        
        await this.userSessionRepository.save(session);
      }

      return {
        remainingAttempts: Math.max(0, session.maxAttempts - session.attempts),
        isBlocked: session.isBlocked,
        blockedUntil: session.blockedUntil || undefined
      };
    } catch (error) {
      if (error instanceof DatabaseConnectionError || error instanceof DatabaseQueryError) {
        throw error;
      }
      throw new DatabaseQueryError('Błąd podczas rejestrowania próby użytkownika');
    }
  }

  async resetSession(sessionId: string): Promise<void> {
    try {
      const session = await this.getOrCreateSession(sessionId);
      session.attempts = 0;
      session.isBlocked = false;
      session.blockedUntil = null;
      session.lastAttempt = null;
      await this.userSessionRepository.save(session);
    } catch (error) {
      if (error instanceof DatabaseConnectionError || error instanceof DatabaseQueryError) {
        throw error;
      }
      throw new DatabaseQueryError('Błąd podczas resetowania sesji użytkownika');
    }
  }
} 
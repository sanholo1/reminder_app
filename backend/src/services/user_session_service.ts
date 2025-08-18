import { AppDataSource } from '../config/database';
import { UserSession } from '../entities/UserSession';
import { ForbiddenError, DatabaseConnectionError, DatabaseQueryError, DailyUsageLimitExceededError } from '../exceptions/exception_handler';

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
          lastAttempt: null,
          dailyUsageCount: 0,
          lastUsageDate: null,
          maxDailyUsage: 20
        });
        await this.userSessionRepository.save(session);
      } else {
        // Ensure existing sessions have the new fields with default values
        let needsUpdate = false;
        
        if (session.dailyUsageCount === undefined || session.dailyUsageCount === null) {
          session.dailyUsageCount = 0;
          needsUpdate = true;
        }
        if (session.maxDailyUsage === undefined || session.maxDailyUsage === null) {
          session.maxDailyUsage = 20;
          needsUpdate = true;
        }
        if (session.lastUsageDate === undefined || session.lastUsageDate === null) {
          session.lastUsageDate = null;
          needsUpdate = true;
        }
        
        // Save the session if we updated any fields
        if (needsUpdate) {
          await this.userSessionRepository.save(session);
        }
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

  async checkDailyUsageLimit(sessionId: string): Promise<{ 
    canUse: boolean; 
    remainingDailyUsage: number; 
    dailyUsageCount: number;
    maxDailyUsage: number;
    lastUsageDate: Date | null;
  }> {
    try {
      const session = await this.getOrCreateSession(sessionId);
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Check if we need to reset daily usage (new day)
      if (session.lastUsageDate) {
        // Ensure lastUsageDate is a Date object
        const lastUsageDate = session.lastUsageDate instanceof Date ? session.lastUsageDate : new Date(session.lastUsageDate);
        const lastUsageDay = new Date(lastUsageDate.getFullYear(), lastUsageDate.getMonth(), lastUsageDate.getDate());
        
        if (lastUsageDay < today) {
          // New day, reset daily usage count
          session.dailyUsageCount = 0;
          session.lastUsageDate = today;
          await this.userSessionRepository.save(session);
        }
      } else {
        // First time usage, set today's date
        session.lastUsageDate = today;
        await this.userSessionRepository.save(session);
      }
      
      const canUse = session.dailyUsageCount < session.maxDailyUsage;
      const remainingDailyUsage = Math.max(0, session.maxDailyUsage - session.dailyUsageCount);
      
      return {
        canUse,
        remainingDailyUsage,
        dailyUsageCount: session.dailyUsageCount,
        maxDailyUsage: session.maxDailyUsage,
        lastUsageDate: session.lastUsageDate
      };
    } catch (error) {
      if (error instanceof DatabaseConnectionError || error instanceof DatabaseQueryError) {
        throw error;
      }
      throw new DatabaseQueryError('Błąd podczas sprawdzania dziennego limitu użycia');
    }
  }

  async recordDailyUsage(sessionId: string): Promise<{ 
    remainingDailyUsage: number; 
    dailyUsageCount: number;
    maxDailyUsage: number;
  }> {
    try {
      const session = await this.getOrCreateSession(sessionId);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Check if we need to reset daily usage (new day)
      if (session.lastUsageDate) {
        // Ensure lastUsageDate is a Date object
        const lastUsageDate = session.lastUsageDate instanceof Date ? session.lastUsageDate : new Date(session.lastUsageDate);
        const lastUsageDay = new Date(lastUsageDate.getFullYear(), lastUsageDate.getMonth(), lastUsageDate.getDate());
        
        if (lastUsageDay < today) {
          // New day, reset daily usage count
          session.dailyUsageCount = 0;
          session.lastUsageDate = today;
        }
      } else {
        // First time usage, set today's date
        session.lastUsageDate = today;
      }
      
      // Increment daily usage count
      session.dailyUsageCount += 1;
      await this.userSessionRepository.save(session);
      
      return {
        remainingDailyUsage: Math.max(0, session.maxDailyUsage - session.dailyUsageCount),
        dailyUsageCount: session.dailyUsageCount,
        maxDailyUsage: session.maxDailyUsage
      };
    } catch (error) {
      if (error instanceof DatabaseConnectionError || error instanceof DatabaseQueryError) {
        throw error;
      }
      throw new DatabaseQueryError('Błąd podczas rejestrowania dziennego użycia');
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

  async getUsageInfo(sessionId: string): Promise<{
    dailyUsageCount: number;
    maxDailyUsage: number;
    remainingDailyUsage: number;
    lastUsageDate: Date | null;
    attempts: number;
    maxAttempts: number;
    remainingAttempts: number;
  }> {
    try {
      const session = await this.getOrCreateSession(sessionId);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Check if we need to reset daily usage (new day)
      if (session.lastUsageDate) {
        // Ensure lastUsageDate is a Date object
        const lastUsageDate = session.lastUsageDate instanceof Date ? session.lastUsageDate : new Date(session.lastUsageDate);
        const lastUsageDay = new Date(lastUsageDate.getFullYear(), lastUsageDate.getMonth(), lastUsageDate.getDate());
        
        if (lastUsageDay < today) {
          // New day, reset daily usage count
          session.dailyUsageCount = 0;
          session.lastUsageDate = today;
          await this.userSessionRepository.save(session);
        }
      }
      
      return {
        dailyUsageCount: session.dailyUsageCount,
        maxDailyUsage: session.maxDailyUsage,
        remainingDailyUsage: Math.max(0, session.maxDailyUsage - session.dailyUsageCount),
        lastUsageDate: session.lastUsageDate,
        attempts: session.attempts,
        maxAttempts: session.maxAttempts,
        remainingAttempts: Math.max(0, session.maxAttempts - session.attempts)
      };
    } catch (error) {
      if (error instanceof DatabaseConnectionError || error instanceof DatabaseQueryError) {
        throw error;
      }
      throw new DatabaseQueryError('Błąd podczas pobierania informacji o użyciu');
    }
  }
} 
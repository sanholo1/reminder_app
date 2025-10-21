import { ReminderReadRepositoryTypeORM } from '../repositories/reminder_read_repository_typeorm';
import { InternalServerError } from '../exceptions/exception_handler';

export interface GetActiveRemindersQuery {
  sessionId: string;
}

export interface ActiveReminderDTO {
  id: string;
  activity: string;
  datetime: string;
  category?: string | null;
  created_at?: string;
}

export interface GetActiveRemindersResult {
  activeReminders: ActiveReminderDTO[];
  _currentTime: string;
}

export class GetActiveRemindersHandler {
  private reminderRepository: ReminderReadRepositoryTypeORM;

  constructor() {
    this.reminderRepository = new ReminderReadRepositoryTypeORM();
  }

  async execute(query: GetActiveRemindersQuery): Promise<GetActiveRemindersResult> {
    try {
      const now = new Date();
      const reminders = await this.reminderRepository.getActiveReminders(query.sessionId);

      return {
        activeReminders: reminders.map(reminder => ({
          id: reminder.id,
          activity: reminder.activity,
          datetime: reminder.datetime.toISOString(),
          category: reminder.category,
          created_at: reminder.created_at ? reminder.created_at.toISOString() : undefined,
        })),
        _currentTime: now.toISOString(),
      };
    } catch (error) {
      throw new InternalServerError('Błąd podczas pobierania aktywnych przypomnień z bazy danych');
    }
  }
}

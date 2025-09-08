import { ReminderReadRepositoryTypeORM } from '../repositories/reminder_read_repository_typeorm';
import { ReminderEntity } from '../repositories/reminder_types';
import { InternalServerError } from '../exceptions/exception_handler';

export interface GetRemindersQuery {
}

export interface GetRemindersResult {
  reminders: Array<{
    id: string;
    activity: string;
    datetime: string;
    category?: string | null;
    created_at: string;
  }>;
}

export class GetRemindersHandler {
  private reminderRepository: ReminderReadRepositoryTypeORM;

  constructor() {
    this.reminderRepository = new ReminderReadRepositoryTypeORM();
  }

  async execute(query: GetRemindersQuery): Promise<GetRemindersResult> {
    try {
      const reminders = await this.reminderRepository.findAll();
      
      return {
        reminders: reminders.map(reminder => ({
          id: reminder.id,
          activity: reminder.activity,
          datetime: reminder.datetime.toISOString(),
          category: reminder.category,
          created_at: reminder.created_at ? reminder.created_at.toISOString() : ''
        }))
      };
    } catch (error) {
      throw new InternalServerError('Błąd podczas pobierania przypomnień z bazy danych');
    }
  }
} 
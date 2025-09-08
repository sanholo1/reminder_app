import { ReminderRepositoryTypeORM, ReminderEntity } from '../repositories/reminder_repository_typeorm';
import { InternalServerError } from '../exceptions/exception_handler';

export interface GetRemindersByCategoryQuery {
  category: string;
}

export interface ReminderListItemDTO {
  id: string;
  activity: string;
  datetime: string;
  category?: string | null;
  created_at?: string;
}

export interface GetRemindersByCategoryResult {
  reminders: ReminderListItemDTO[];
}

export class GetRemindersByCategoryHandler {
  private reminderRepository: ReminderRepositoryTypeORM;

  constructor() {
    this.reminderRepository = new ReminderRepositoryTypeORM();
  }

  async execute(query: GetRemindersByCategoryQuery): Promise<GetRemindersByCategoryResult> {
    try {
      const reminders: ReminderEntity[] = await this.reminderRepository.findByCategory(query.category);
      return {
        reminders: reminders.map(r => ({
          id: r.id,
          activity: r.activity,
          datetime: r.datetime.toISOString(),
          category: r.category,
          created_at: r.created_at ? r.created_at.toISOString() : undefined
        }))
      };
    } catch (error) {
      throw new InternalServerError('Błąd podczas pobierania przypomnień z kategorii');
    }
  }
}



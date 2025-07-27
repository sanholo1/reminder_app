import { ReminderRepositoryTypeORM, ReminderEntity } from '../repositories/reminder_repository_typeorm';

export interface GetRemindersQuery {
}

export interface GetRemindersResult {
  reminders: Array<{
    id: string;
    activity: string;
    datetime: string;
    created_at: string;
  }>;
}

export class GetRemindersHandler {
  private reminderRepository: ReminderRepositoryTypeORM;

  constructor() {
    this.reminderRepository = new ReminderRepositoryTypeORM();
  }

  async execute(query: GetRemindersQuery): Promise<GetRemindersResult> {
    const reminders = await this.reminderRepository.findAll();
    
    return {
      reminders: reminders.map(reminder => ({
        id: reminder.id,
        activity: reminder.activity,
        datetime: reminder.datetime.toISOString(),
        created_at: reminder.created_at ? reminder.created_at.toISOString() : ''
      }))
    };
  }
} 
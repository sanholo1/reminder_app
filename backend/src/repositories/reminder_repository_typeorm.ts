import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Reminder } from "../entities/Reminder";

export interface ReminderEntity {
  id: string;
  activity: string;
  datetime: Date;
  created_at?: Date;
}

export class ReminderRepositoryTypeORM {
  private repository: Repository<Reminder>;

  constructor() {
    this.repository = AppDataSource.getRepository(Reminder);
  }

  async create(reminder: ReminderEntity): Promise<void> {
    const newReminder = new Reminder(reminder.id, reminder.activity, reminder.datetime);
    await this.repository.save(newReminder);
  }

  async findAll(): Promise<ReminderEntity[]> {
    const reminders = await this.repository.find({
      order: {
        datetime: "ASC"
      }
    });
    
    return reminders.map(reminder => ({
      id: reminder.id,
      activity: reminder.activity,
      datetime: reminder.datetime,
      created_at: reminder.created_at
    }));
  }

  async findById(id: string): Promise<ReminderEntity | null> {
    const reminder = await this.repository.findOne({
      where: { id }
    });
    
    if (!reminder) return null;
    
    return {
      id: reminder.id,
      activity: reminder.activity,
      datetime: reminder.datetime,
      created_at: reminder.created_at
    };
  }
} 
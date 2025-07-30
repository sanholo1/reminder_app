import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Reminder } from "../entities/Reminder";
import { InternalServerError, NotFoundError } from "../exceptions/exception_handler";

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
    try {
      const newReminder = new Reminder(reminder.id, reminder.activity, reminder.datetime);
      await this.repository.save(newReminder);
    } catch (error) {
      throw new InternalServerError('Błąd podczas tworzenia przypomnienia w bazie danych');
    }
  }

  async findAll(): Promise<ReminderEntity[]> {
    try {
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
    } catch (error) {
      throw new InternalServerError('Błąd podczas pobierania przypomnień z bazy danych');
    }
  }

  async findById(id: string): Promise<ReminderEntity | null> {
    try {
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
    } catch (error) {
      throw new InternalServerError('Błąd podczas wyszukiwania przypomnienia w bazie danych');
    }
  }
} 
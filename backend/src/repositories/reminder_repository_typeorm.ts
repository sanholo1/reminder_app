import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Reminder } from "../entities/Reminder";
import { InternalServerError, NotFoundError } from "../exceptions/exception_handler";

export interface ReminderEntity {
  id: string;
  activity: string;
  datetime: Date;
  category?: string | null;
  created_at?: Date;
}

export class ReminderRepositoryTypeORM {
  private repository: Repository<Reminder>;

  constructor() {
    this.repository = AppDataSource.getRepository(Reminder);
  }

  async create(reminder: ReminderEntity): Promise<void> {
    try {
      const newReminder = new Reminder(reminder.id, reminder.activity, reminder.datetime, reminder.category);
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
        category: reminder.category,
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
        category: reminder.category,
        created_at: reminder.created_at
      };
    } catch (error) {
      throw new InternalServerError('Błąd podczas wyszukiwania przypomnienia w bazie danych');
    }
  }

  async findByCategory(category: string): Promise<ReminderEntity[]> {
    try {
      const reminders = await this.repository.find({
        where: { category },
        order: {
          datetime: "ASC"
        }
      });
      
      return reminders.map(reminder => ({
        id: reminder.id,
        activity: reminder.activity,
        datetime: reminder.datetime,
        category: reminder.category,
        created_at: reminder.created_at
      }));
    } catch (error) {
      throw new InternalServerError('Błąd podczas pobierania przypomnień z kategorii z bazy danych');
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const reminders = await this.repository.find({
        select: ['category']
      });
      
      const categories = reminders
        .map(reminder => reminder.category)
        .filter((category): category is string => category !== null && category !== undefined)
        .filter((category, index, self) => self.indexOf(category) === index); // Remove duplicates
      
      return categories;
    } catch (error) {
      throw new InternalServerError('Błąd podczas pobierania kategorii z bazy danych');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const reminder = await this.repository.findOne({
        where: { id }
      });
      
      if (!reminder) {
        throw new NotFoundError('Przypomnienie o podanym identyfikatorze nie istnieje');
      }
      
      await this.repository.remove(reminder);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Błąd podczas usuwania przypomnienia z bazy danych');
    }
  }

  async deleteByCategory(category: string): Promise<number> {
    try {
      const reminders = await this.repository.find({
        where: { category }
      });
      
      if (reminders.length === 0) {
        return 0;
      }
      
      await this.repository.remove(reminders);
      return reminders.length;
    } catch (error) {
      throw new InternalServerError('Błąd podczas usuwania kategorii z bazy danych');
    }
  }
} 
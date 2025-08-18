import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Reminder } from "../entities/Reminder";
import { TrashItem } from "../entities/TrashItem";
import { 
  NotFoundError, 
  DatabaseConnectionError,
  DatabaseQueryError,
  DatabaseTimeoutError
} from "../exceptions/exception_handler";
import { TrashRepositoryTypeORM, TrashItemEntity } from "./trash_repository_typeorm";
import { DateTime } from "luxon";

export interface ReminderEntity {
  id: string;
  activity: string;
  datetime: Date;
  category?: string | null;
  sessionId: string;
  created_at?: Date;
}

export class ReminderRepositoryTypeORM {
  private repository: Repository<Reminder>;
  private trashRepository: TrashRepositoryTypeORM;

  constructor() {
    this.repository = AppDataSource.getRepository(Reminder);
    this.trashRepository = new TrashRepositoryTypeORM();
  }

  async create(reminder: ReminderEntity): Promise<void> {
    try {
      const newReminder = new Reminder(reminder.id, reminder.activity, reminder.datetime, reminder.category, reminder.sessionId);
      await this.repository.save(newReminder);
    } catch (error) {
      throw new DatabaseConnectionError('Błąd podczas tworzenia przypomnienia w bazie danych');
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
        sessionId: reminder.sessionId,
        created_at: reminder.created_at
      }));
    } catch (error) {
      throw new DatabaseQueryError('Błąd podczas pobierania przypomnień z bazy danych');
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
        sessionId: reminder.sessionId,
        created_at: reminder.created_at
      };
    } catch (error) {
      throw new DatabaseQueryError('Błąd podczas wyszukiwania przypomnienia w bazie danych');
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
        sessionId: reminder.sessionId,
        created_at: reminder.created_at
      }));
    } catch (error) {
      throw new DatabaseQueryError('Błąd podczas pobierania przypomnień z kategorii z bazy danych');
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
      throw new DatabaseQueryError('Błąd podczas pobierania kategorii z bazy danych');
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
      
      // Dodaj do kosza przed usunięciem
      await this.trashRepository.addToTrash({
        id: reminder.id,
        activity: reminder.activity,
        datetime: reminder.datetime,
        category: reminder.category,
        sessionId: reminder.sessionId,
        deleted_at: new Date(),
        created_at: reminder.created_at
      });
      
      // Usuń z głównej tabeli
      await this.repository.remove(reminder);
      
      // Wyczyść stare elementy z kosza (zachowaj tylko 10 najnowszych)
      await this.trashRepository.clearOldItems();
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseQueryError('Błąd podczas usuwania przypomnienia z bazy danych');
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
      
      // Dodaj wszystkie przypomnienia z kategorii do kosza
      for (const reminder of reminders) {
        await this.trashRepository.addToTrash({
          id: reminder.id,
          activity: reminder.activity,
          datetime: reminder.datetime,
          category: reminder.category,
          sessionId: reminder.sessionId,
          deleted_at: new Date(),
          created_at: reminder.created_at
        });
      }
      
      await this.repository.remove(reminders);
      
      // Wyczyść stare elementy z kosza
      await this.trashRepository.clearOldItems();
      
      return reminders.length;
    } catch (error) {
      throw new DatabaseQueryError('Błąd podczas usuwania kategorii z bazy danych');
    }
  }

  async getTrashItems(): Promise<TrashItemEntity[]> {
    try {
      return await this.trashRepository.getTrashItems();
    } catch (error) {
      throw new DatabaseQueryError('Błąd podczas pobierania elementów z kosza');
    }
  }

  async restoreFromTrash(id: string): Promise<void> {
    try {
      const itemToRestore = await this.trashRepository.restoreFromTrash(id);
      
      if (!itemToRestore) {
        throw new NotFoundError('Element nie został znaleziony w koszu');
      }
      
      // Przywróć przypomnienie do głównej tabeli
      const restoredReminder = new Reminder(
        itemToRestore.id,
        itemToRestore.activity,
        itemToRestore.datetime,
        itemToRestore.category
      );
      
      await this.repository.save(restoredReminder);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseQueryError('Błąd podczas przywracania z kosza');
    }
  }

  async getActiveReminders(sessionId: string, currentTime: Date): Promise<ReminderEntity[]> {
    try {
      // Używamy lokalnej strefy czasowej (tej samej, w której zapisany jest DATETIME w MySQL)
      // oraz okna +/- 1 minuta wokół bieżącego czasu lokalnego
      const nowLocal = DateTime.local();
      // Nie uruchamiaj przed czasem: start = teraz, koniec = +1 min
      const startTimeStr = nowLocal.toFormat('yyyy-LL-dd HH:mm:ss');
      const endTimeStr = nowLocal.plus({ minutes: 1 }).toFormat('yyyy-LL-dd HH:mm:ss');

      const activeReminders = await this.repository
        .createQueryBuilder('reminder')
        .where('reminder.datetime BETWEEN :startTime AND :endTime', {
          startTime: startTimeStr,
          endTime: endTimeStr,
        })
        .andWhere('reminder.sessionId = :sessionId', { sessionId })
        .getMany();

      return activeReminders.map(reminder => ({
        id: reminder.id,
        activity: reminder.activity,
        datetime: reminder.datetime,
        category: reminder.category,
        sessionId: reminder.sessionId,
        created_at: reminder.created_at
      }));
    } catch (error) {
      throw new DatabaseQueryError('Błąd podczas pobierania aktywnych przypomnień z bazy danych');
    }
  }
} 
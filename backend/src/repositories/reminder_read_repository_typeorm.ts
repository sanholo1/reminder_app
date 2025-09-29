import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Reminder } from '../entities/Reminder';
import { DatabaseQueryError } from '../exceptions/exception_handler';
import { ReminderEntity } from './reminder_types';
import { DateTime } from 'luxon';
import { TrashRepositoryTypeORM, TrashItemEntity } from './trash_repository_typeorm';

export class ReminderReadRepositoryTypeORM {
  private repository: Repository<Reminder>;

  constructor() {
    this.repository = AppDataSource.getRepository(Reminder);
  }

  async findAll(userId?: string): Promise<ReminderEntity[]> {
    try {
      const where = userId ? { userId } : {};
      const reminders = await this.repository.find({
        where,
        order: { datetime: 'ASC' }
      });
      return reminders.map(reminder => ({
        id: reminder.id,
        activity: reminder.activity,
        datetime: reminder.datetime,
        category: reminder.category,
        sessionId: reminder.sessionId,
        userId: reminder.userId,
        created_at: reminder.created_at
      }));
    } catch (error) {
      throw new DatabaseQueryError('Błąd podczas pobierania przypomnień z bazy danych');
    }
  }

  async findById(id: string): Promise<ReminderEntity | null> {
    try {
      const reminder = await this.repository.findOne({ where: { id } });
      if (!reminder) return null;
      return {
        id: reminder.id,
        activity: reminder.activity,
        datetime: reminder.datetime,
        category: reminder.category,
        sessionId: reminder.sessionId,
        userId: reminder.userId,
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
        order: { datetime: 'ASC' }
      });
      return reminders.map(reminder => ({
        id: reminder.id,
        activity: reminder.activity,
        datetime: reminder.datetime,
        category: reminder.category,
        sessionId: reminder.sessionId,
        userId: reminder.userId,
        created_at: reminder.created_at
      }));
    } catch (error) {
      throw new DatabaseQueryError('Błąd podczas pobierania przypomnień z kategorii z bazy danych');
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const reminders = await this.repository.find({ select: ['category'] });
      return reminders
        .map(reminder => reminder.category)
        .filter((category): category is string => category !== null && category !== undefined)
        .filter((category, index, self) => self.indexOf(category) === index);
    } catch (error) {
      throw new DatabaseQueryError('Błąd podczas pobierania kategorii z bazy danych');
    }
  }

  async getActiveReminders(sessionId: string): Promise<ReminderEntity[]> {
    try {
      const nowLocal = DateTime.local();
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
  userId: reminder.userId,
  created_at: reminder.created_at
      }));
    } catch (error) {
      throw new DatabaseQueryError('Błąd podczas pobierania aktywnych przypomnień z bazy danych');
    }
  }

  async getTrashItems(): Promise<TrashItemEntity[]> {
    try {
      const trashRepository = new TrashRepositoryTypeORM();
      return await trashRepository.getTrashItems();
    } catch (error) {
      throw new DatabaseQueryError('Błąd podczas pobierania elementów z kosza');
    }
  }
}



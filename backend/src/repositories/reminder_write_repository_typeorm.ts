import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Reminder } from '../entities/Reminder';
import { DatabaseConnectionError, DatabaseQueryError, NotFoundError } from '../exceptions/exception_handler';
import { ReminderEntity } from './reminder_types';
import { TrashRepositoryTypeORM } from './trash_repository_typeorm';

export class ReminderWriteRepositoryTypeORM {
  private repository: Repository<Reminder>;
  private trashRepository: TrashRepositoryTypeORM;

  constructor() {
    this.repository = AppDataSource.getRepository(Reminder);
    this.trashRepository = new TrashRepositoryTypeORM();
  }

  async create(reminder: ReminderEntity): Promise<void> {
    try {
  const newReminder = new Reminder(reminder.id, reminder.activity, reminder.datetime, reminder.category, reminder.sessionId, reminder.userId);
  await this.repository.save(newReminder);
    } catch (error) {
      throw new DatabaseConnectionError('errors.createReminder');
    }
  }

  async delete(id: string, userId: string): Promise<void> {
    try {
      const reminder = await this.repository.findOne({ where: { id, userId } });
      if (!reminder) {
        throw new NotFoundError('errors.reminderNotFound');
      }
      await this.trashRepository.addToTrash({
        id: reminder.id,
        activity: reminder.activity,
        datetime: reminder.datetime,
        category: reminder.category,
        sessionId: reminder.sessionId,
        userId: reminder.userId,
        deleted_at: new Date(),
        created_at: reminder.created_at
      });
      await this.repository.remove(reminder);
      await this.trashRepository.clearOldItems();
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseQueryError('errors.deleteReminder');
    }
  }

  async deleteByCategory(category: string): Promise<number> {
    try {
      const reminders = await this.repository.find({ where: { category } });
      if (reminders.length === 0) {
        return 0;
      }
      for (const reminder of reminders) {
        await this.trashRepository.addToTrash({
          id: reminder.id,
          activity: reminder.activity,
          datetime: reminder.datetime,
          category: reminder.category,
          sessionId: reminder.sessionId,
          userId: reminder.userId,
          deleted_at: new Date(),
          created_at: reminder.created_at
        });
      }
      await this.repository.remove(reminders);
      await this.trashRepository.clearOldItems();
      return reminders.length;
    } catch (error) {
      throw new DatabaseQueryError('errors.deleteCategory');
    }
  }

  async restoreFromTrash(id: string): Promise<void> {
    try {
      const itemToRestore = await this.trashRepository.restoreFromTrash(id);
      if (!itemToRestore) {
        throw new NotFoundError('errors.trashItemNotFound');
      }
      const restoredReminder = new Reminder(
        itemToRestore.id,
        itemToRestore.activity,
        itemToRestore.datetime,
        itemToRestore.category,
        itemToRestore.sessionId,
        itemToRestore.userId
      );
      await this.repository.save(restoredReminder);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseQueryError('errors.restoreFromTrash');
    }
  }

  async update(id: string, data: { activity?: string; datetime?: Date; category?: string | null }): Promise<void> {
    try {
      const reminder = await this.repository.findOne({ where: { id } });
      if (!reminder) {
        throw new NotFoundError('errors.reminderNotFound');
      }
      if (typeof data.activity !== 'undefined') reminder.activity = data.activity;
      if (typeof data.datetime !== 'undefined') reminder.datetime = data.datetime;
      if (typeof data.category !== 'undefined') reminder.category = data.category ?? null;
      await this.repository.save(reminder);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseQueryError('errors.updateReminder');
    }
  }
}



import { ReminderReadRepositoryTypeORM } from '../repositories/reminder_read_repository_typeorm';
import { InternalServerError } from '../exceptions/exception_handler';

export interface GetCategoriesQuery {}

export interface GetCategoriesResult {
  categories: string[];
}

export class GetCategoriesHandler {
  private reminderRepository: ReminderReadRepositoryTypeORM;

  constructor() {
    this.reminderRepository = new ReminderReadRepositoryTypeORM();
  }

  async execute(_query: GetCategoriesQuery): Promise<GetCategoriesResult> {
    try {
      const categories = await this.reminderRepository.getCategories();
      return { categories };
    } catch (error) {
      throw new InternalServerError('Błąd podczas pobierania kategorii z bazy danych');
    }
  }
}



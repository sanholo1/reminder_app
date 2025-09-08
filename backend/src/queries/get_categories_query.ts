import { ReminderRepositoryTypeORM } from '../repositories/reminder_repository_typeorm';
import { InternalServerError } from '../exceptions/exception_handler';

export interface GetCategoriesQuery {}

export interface GetCategoriesResult {
  categories: string[];
}

export class GetCategoriesHandler {
  private reminderRepository: ReminderRepositoryTypeORM;

  constructor() {
    this.reminderRepository = new ReminderRepositoryTypeORM();
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



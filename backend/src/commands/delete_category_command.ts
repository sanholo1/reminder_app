import { ReminderWriteRepositoryTypeORM } from '../repositories/reminder_write_repository_typeorm';
import { InternalServerError } from '../exceptions/exception_handler';

export interface DeleteCategoryCommand {
  category: string;
}

export interface DeleteCategoryResult {
  message: string;
  deletedCount: number;
}

export class DeleteCategoryHandler {
  private reminderRepository: ReminderWriteRepositoryTypeORM;

  constructor() {
    this.reminderRepository = new ReminderWriteRepositoryTypeORM();
  }

  async execute(command: DeleteCategoryCommand): Promise<DeleteCategoryResult> {
    try {
      const deletedCount = await this.reminderRepository.deleteByCategory(command.category);
      return {
        message: `Usunięto kategorię "${command.category}" wraz z ${deletedCount} przypomnieniami`,
        deletedCount
      };
    } catch (error) {
      throw new InternalServerError('Błąd podczas usuwania kategorii z bazy danych');
    }
  }
}



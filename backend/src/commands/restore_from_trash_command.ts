import { ReminderRepositoryTypeORM } from '../repositories/reminder_repository_typeorm';
import { InternalServerError, NotFoundError } from '../exceptions/exception_handler';

export interface RestoreFromTrashCommand {
  id: string;
}

export interface RestoreFromTrashResult {
  message: string;
}

export class RestoreFromTrashHandler {
  private reminderRepository: ReminderRepositoryTypeORM;

  constructor() {
    this.reminderRepository = new ReminderRepositoryTypeORM();
  }

  async execute(command: RestoreFromTrashCommand): Promise<RestoreFromTrashResult> {
    try {
      await this.reminderRepository.restoreFromTrash(command.id);
      return { message: 'Przypomnienie zostało przywrócone' };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Błąd podczas przywracania z kosza');
    }
  }
}



import { ReminderWriteRepositoryTypeORM } from '../repositories/reminder_write_repository_typeorm';
import { InternalServerError, NotFoundError } from '../exceptions/exception_handler';

export interface RestoreFromTrashCommand {
  id: string;
}

export interface RestoreFromTrashResult {
  message: string;
}

export class RestoreFromTrashHandler {
  private reminderRepository: ReminderWriteRepositoryTypeORM;

  constructor() {
    this.reminderRepository = new ReminderWriteRepositoryTypeORM();
  }

  async execute(command: RestoreFromTrashCommand): Promise<RestoreFromTrashResult> {
    try {
      await this.reminderRepository.restoreFromTrash(command.id);
      return { message: 'Przypomnienie zostało przywrócone' };
    } catch (_error) {
      if (_error instanceof NotFoundError) {
        throw _error;
      }
      throw new InternalServerError('Błąd podczas przywracania z kosza');
    }
  }
}

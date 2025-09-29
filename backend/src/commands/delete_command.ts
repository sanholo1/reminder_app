import { ReminderWriteRepositoryTypeORM } from '../repositories/reminder_write_repository_typeorm';
import { NotFoundError } from '../exceptions/exception_handler';

export interface DeleteReminderCommand {
  id: string;
  userId: string;
}

export interface DeleteReminderResult {
  success: boolean;
  message: string;
}

export class DeleteReminderHandler {
  private reminderRepository: ReminderWriteRepositoryTypeORM;

  constructor() {
    this.reminderRepository = new ReminderWriteRepositoryTypeORM();
  }

  async execute(command: DeleteReminderCommand): Promise<DeleteReminderResult> {
    try {
      await this.reminderRepository.delete(command.id, command.userId);
      return {
        success: true,
        message: 'Przypomnienie zostało pomyślnie usunięte'
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error('Błąd podczas usuwania przypomnienia');
    }
  }
}

import { ReminderRepositoryTypeORM } from '../repositories/reminder_repository_typeorm';
import { NotFoundError } from '../exceptions/exception_handler';

export interface DeleteReminderCommand {
  id: string;
}

export interface DeleteReminderResult {
  success: boolean;
  message: string;
}

export class DeleteReminderHandler {
  private reminderRepository: ReminderRepositoryTypeORM;

  constructor() {
    this.reminderRepository = new ReminderRepositoryTypeORM();
  }

  async execute(command: DeleteReminderCommand): Promise<DeleteReminderResult> {
    try {
      await this.reminderRepository.delete(command.id);
      
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

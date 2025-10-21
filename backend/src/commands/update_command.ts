import { ReminderWriteRepositoryTypeORM } from '../repositories/reminder_write_repository_typeorm';
import {
  InternalServerError,
  NotFoundError,
  ValidationError,
  PastTimeEditError,
} from '../exceptions/exception_handler';

export interface UpdateReminderCommand {
  id: string;
  activity?: string;
  datetime?: string; // ISO string
  category?: string | null;
}

export interface UpdateReminderResult {
  success: boolean;
  message: string;
}

export class UpdateReminderHandler {
  private reminderRepository: ReminderWriteRepositoryTypeORM;

  constructor(reminderRepository?: ReminderWriteRepositoryTypeORM) {
    this.reminderRepository = reminderRepository || new ReminderWriteRepositoryTypeORM();
  }

  async execute(command: UpdateReminderCommand): Promise<UpdateReminderResult> {
    if (!command.id) {
      throw new ValidationError('errors.missingId');
    }
    if (!command.activity && !command.datetime && typeof command.category === 'undefined') {
      throw new ValidationError('errors.missingData');
    }
    const MAX_ACTIVITY_LENGTH = 200;
    if (command.activity && command.activity.length > MAX_ACTIVITY_LENGTH) {
      throw new ValidationError(`errors.activityTooLong`);
    }

    // Walidacja daty - nie można edytować przypomnienia na datę w przeszłości
    if (command.datetime) {
      const newDateTime = new Date(command.datetime);
      const now = new Date();
      if (newDateTime < now) {
        throw new PastTimeEditError();
      }
    }

    try {
      await this.reminderRepository.update(command.id, {
        activity: command.activity,
        datetime: command.datetime ? new Date(command.datetime) : undefined,
        category: typeof command.category !== 'undefined' ? command.category : undefined,
      });
      return { success: true, message: 'Przypomnienie zaktualizowane' };
    } catch (_error) {
      if (
        _error instanceof NotFoundError ||
        _error instanceof ValidationError ||
        _error instanceof PastTimeEditError
      ) {
        throw _error;
      }
      throw new InternalServerError('errors.updateReminder');
    }
  }
}

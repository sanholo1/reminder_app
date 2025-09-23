import { ReminderWriteRepositoryTypeORM } from '../repositories/reminder_write_repository_typeorm';
import { InternalServerError, NotFoundError, ValidationError } from '../exceptions/exception_handler';

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
    if (!command.id) throw new ValidationError('Brak identyfikatora przypomnienia');
    if (!command.activity && !command.datetime && typeof command.category === 'undefined') {
      throw new ValidationError('Brak danych do aktualizacji');
    }
    const MAX_ACTIVITY_LENGTH = 200;
    if (command.activity && command.activity.length > MAX_ACTIVITY_LENGTH) {
      throw new ValidationError(`Aktywność przekracza maksymalną długość ${MAX_ACTIVITY_LENGTH} znaków`);
    }
    try {
      await this.reminderRepository.update(command.id, {
        activity: command.activity,
        datetime: command.datetime ? new Date(command.datetime) : undefined,
        category: typeof command.category !== 'undefined' ? command.category : undefined
      });
      return { success: true, message: 'Przypomnienie zaktualizowane' };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new InternalServerError('Błąd podczas aktualizacji przypomnienia');
    }
  }
}



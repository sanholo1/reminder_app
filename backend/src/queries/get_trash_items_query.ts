import { ReminderRepositoryTypeORM } from '../repositories/reminder_repository_typeorm';
import { InternalServerError } from '../exceptions/exception_handler';
import { TrashItemEntity } from '../repositories/trash_repository_typeorm';

export interface GetTrashItemsQuery {}

export interface TrashItemDTO {
  id: string;
  activity: string;
  datetime: string;
  category?: string | null;
  sessionId: string;
  deleted_at: string;
  created_at?: string;
}

export interface GetTrashItemsResult {
  trashItems: TrashItemDTO[];
}

export class GetTrashItemsHandler {
  private reminderRepository: ReminderRepositoryTypeORM;

  constructor() {
    this.reminderRepository = new ReminderRepositoryTypeORM();
  }

  async execute(_query: GetTrashItemsQuery): Promise<GetTrashItemsResult> {
    try {
      const items: TrashItemEntity[] = await this.reminderRepository.getTrashItems();
      return {
        trashItems: items.map(i => ({
          id: i.id,
          activity: i.activity,
          datetime: i.datetime.toISOString(),
          category: i.category,
          sessionId: i.sessionId,
          deleted_at: i.deleted_at.toISOString(),
          created_at: i.created_at ? i.created_at.toISOString() : undefined
        }))
      };
    } catch (error) {
      throw new InternalServerError('Błąd podczas pobierania elementów z kosza');
    }
  }
}



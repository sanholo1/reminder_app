import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { TrashItem } from "../entities/TrashItem";
import { InternalServerError, NotFoundError } from "../exceptions/exception_handler";

export interface TrashItemEntity {
  id: string;
  activity: string;
  datetime: Date;
  category?: string | null;
  deleted_at: Date;
  created_at?: Date;
}

export class TrashRepositoryTypeORM {
  private repository: Repository<TrashItem>;

  constructor() {
    this.repository = AppDataSource.getRepository(TrashItem);
  }

  async addToTrash(reminder: TrashItemEntity): Promise<void> {
    try {
      const trashItem = new TrashItem(reminder.id, reminder.activity, reminder.datetime, reminder.category);
      await this.repository.save(trashItem);
    } catch (error) {
      throw new InternalServerError('Błąd podczas dodawania do kosza');
    }
  }

  async getTrashItems(): Promise<TrashItemEntity[]> {
    try {
      const trashItems = await this.repository.find({
        order: {
          deleted_at: "DESC"
        },
        take: 10 // Maksymalnie 10 ostatnich elementów
      });
      
      return trashItems.map(item => ({
        id: item.id,
        activity: item.activity,
        datetime: item.datetime,
        category: item.category,
        deleted_at: item.deleted_at,
        created_at: item.created_at
      }));
    } catch (error) {
      throw new InternalServerError('Błąd podczas pobierania elementów z kosza');
    }
  }

  async restoreFromTrash(id: string): Promise<TrashItemEntity | null> {
    try {
      const trashItem = await this.repository.findOne({
        where: { id }
      });
      
      if (!trashItem) {
        throw new NotFoundError('Element nie został znaleziony w koszu');
      }
      
      const itemToRestore = {
        id: trashItem.id,
        activity: trashItem.activity,
        datetime: trashItem.datetime,
        category: trashItem.category,
        deleted_at: trashItem.deleted_at,
        created_at: trashItem.created_at
      };
      
      // Usuń z kosza
      await this.repository.remove(trashItem);
      
      return itemToRestore;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Błąd podczas przywracania z kosza');
    }
  }

  async clearOldItems(): Promise<void> {
    try {
      // Pobierz wszystkie elementy z kosza
      const allItems = await this.repository.find({
        order: {
          deleted_at: "DESC"
        }
      });
      
      // Jeśli jest więcej niż 10 elementów, usuń najstarsze
      if (allItems.length > 10) {
        const itemsToRemove = allItems.slice(10);
        await this.repository.remove(itemsToRemove);
      }
    } catch (error) {
      throw new InternalServerError('Błąd podczas czyszczenia kosza');
    }
  }
}

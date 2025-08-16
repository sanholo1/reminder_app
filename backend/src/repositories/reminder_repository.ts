import mysql, { Pool } from 'mysql2/promise';
import { InternalServerError, NotFoundError } from '../exceptions/exception_handler';

const databaseConfiguration = {
  host: 'localhost',
  port: 3306,
  user: 'app_user',
  password: 'password',
  database: 'reminder_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool: Pool | null = null;

export async function getDatabasePool(): Promise<Pool> {
  if (!pool) {
    pool = mysql.createPool(databaseConfiguration);
  }
  return pool;
}

export interface ReminderEntity {
  id: string;
  activity: string;
  datetime: Date;
  created_at?: Date;
}

export class ReminderRepository {
  async create(reminder: ReminderEntity): Promise<void> {
    try {
      const db = await getDatabasePool();
      await db.execute(
        'INSERT INTO reminders (id, activity, datetime) VALUES (?, ?, ?)',
        [reminder.id, reminder.activity, reminder.datetime]
      );
    } catch (error) {
      throw new InternalServerError('Błąd podczas tworzenia przypomnienia w bazie danych');
    }
  }

  async findAll(): Promise<ReminderEntity[]> {
    try {
      const db = await getDatabasePool();
      const [rows] = await db.execute(
        'SELECT id, activity, datetime, created_at FROM reminders ORDER BY datetime ASC'
      );
      return (rows as any[]).map(row => ({
        id: row.id,
        activity: row.activity,
        datetime: new Date(row.datetime),
        created_at: row.created_at ? new Date(row.created_at) : undefined
      }));
    } catch (error) {
      throw new InternalServerError('Błąd podczas pobierania przypomnień z bazy danych');
    }
  }

  async findById(id: string): Promise<ReminderEntity | null> {
    try {
      const db = await getDatabasePool();
      const [rows] = await db.execute(
        'SELECT id, activity, datetime, created_at FROM reminders WHERE id = ?',
        [id]
      );
      const result = (rows as any[])[0];
      if (!result) return null;
      return {
        id: result.id,
        activity: result.activity,
        datetime: new Date(result.datetime),
        created_at: result.created_at ? new Date(result.created_at) : undefined
      };
    } catch (error) {
      throw new InternalServerError('Błąd podczas wyszukiwania przypomnienia w bazie danych');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const db = await getDatabasePool();
      const [result] = await db.execute(
        'DELETE FROM reminders WHERE id = ?',
        [id]
      );
      
      if ((result as any).affectedRows === 0) {
        throw new NotFoundError('Przypomnienie o podanym identyfikatorze nie istnieje');
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Błąd podczas usuwania przypomnienia z bazy danych');
    }
  }
} 
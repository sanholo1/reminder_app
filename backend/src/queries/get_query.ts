import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'app_user',
  password: 'password',
  database: 'reminder_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

export interface GetQuery {
}

export interface GetResult {
  reminders: Array<{
    id: string;
    activity: string;
    datetime: string;
    created_at: string;
  }>;
}

export class GetHandler {
  async execute(query: GetQuery): Promise<GetResult> {
    const reminders = await this.getAllFromDatabase();
    
    return {
      reminders: reminders.map(reminder => ({
        id: reminder.id,
        activity: reminder.activity,
        datetime: reminder.datetime.toLocaleString('pl-PL', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        created_at: reminder.created_at.toLocaleString('pl-PL', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      }))
    };
  }

  private async getAllFromDatabase(): Promise<any[]> {
    const [rows] = await pool.execute(`
      SELECT id, activity, datetime, created_at
      FROM reminders 
      ORDER BY datetime ASC
    `);
    
    return rows as any[];
  }
} 
export interface ReminderEntity {
  id: string;
  activity: string;
  datetime: Date;
  category?: string | null;
  sessionId: string;
  created_at?: Date;
}



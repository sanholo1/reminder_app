export interface GetQuery {
  status?: string;
}

export interface Reminder {
  id: string;
  activity: string;
  datetime: string;
  status: string;
  createdAt: string;
}

export class GetHandler {
  async execute(query: GetQuery): Promise<Reminder[]> {
    console.log('Fetching reminders with query:', query);
    
    return [
      {
        id: '1',
        activity: 'Sample reminder',
        datetime: new Date().toLocaleString(),
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ];
  }
} 
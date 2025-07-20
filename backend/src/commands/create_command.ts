export interface CreateCommand {
  text: string;
}

export interface CreateResult {
  activity: string;
  datetime: string;
  error?: string;
}

export class CreateHandler {
  async execute(command: CreateCommand): Promise<CreateResult> {
    const parsed = this.parseText(command.text);
    
    if (parsed.error) {
      return parsed;
    }

    const reminder = {
      id: this.generateId(),
      activity: parsed.activity,
      datetime: parsed.datetime,
      createdAt: new Date()
    };

    await this.save(reminder);

    return parsed;
  }

  private parseText(text: string): CreateResult {
    const clean = text.toLowerCase().replace(/[^\w\s]/g, ' ').trim();
    
    if (!clean) {
      return { 
        activity: '', 
        datetime: '', 
        error: 'Activity is required' 
      };
    }

    const timeMatch = clean.match(/(\d{1,2})[:\s.](\d{2})?/);
    const hour = timeMatch ? parseInt(timeMatch[1]) : null;
    const minute = timeMatch ? (timeMatch[2] ? parseInt(timeMatch[2]) : 0) : null;

    if (hour === null || hour < 0 || hour > 23) {
      return { 
        activity: '', 
        datetime: '', 
        error: 'Valid time is required' 
      };
    }

    const activity = clean.replace(timeMatch ? timeMatch[0] : '', '').trim();

    if (!activity) {
      return { 
        activity: '', 
        datetime: '', 
        error: 'Activity is required' 
      };
    }

    const datetime = this.createDate(hour!, minute || 0);

    if (datetime < new Date()) {
      return { 
        activity: '', 
        datetime: '', 
        error: 'Cannot create reminders for past dates' 
      };
    }

    return {
      activity: activity.charAt(0).toUpperCase() + activity.slice(1),
      datetime: datetime.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  }

  private createDate(hour: number, minute: number = 0): Date {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
    
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    
    return target;
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private async save(reminder: any): Promise<void> {
    console.log('Saving reminder:', reminder);
  }
} 
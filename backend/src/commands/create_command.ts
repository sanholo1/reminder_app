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
    const clean = this.clearText(text.toLowerCase());
    
    if (!clean.trim()) {
      return { 
        activity: '', 
        datetime: '', 
        error: 'Please enter an activity and time' 
      };
    }

    const timeMatch = this.extractTime(clean);
    
    if (!timeMatch) {
      return { 
        activity: '', 
        datetime: '', 
        error: 'Please specify a valid time with the activity (e.g., "buy milk at 15", "meeting tomorrow at 10:30")' 
      };
    }

    const { hour, minute, timePattern } = timeMatch;
    const activity = this.extractActivity(clean, timePattern);

    if (!activity.trim()) {
      return { 
        activity: '', 
        datetime: '', 
        error: 'Please specify what you want to be reminded about' 
      };
    }

    const datetime = this.createDate(hour, minute, clean);

    if (datetime < new Date()) {
      return { 
        activity: '', 
        datetime: '', 
        error: 'Cannot create reminders for past dates' 
      };
    }

    return {
      activity: this.capitalizeFirstLetter(activity),
      datetime: datetime.toLocaleString('pl-PL', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    };
  }

  private clearText(text: string): string {
    return text
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractTime(text: string): { hour: number; minute: number; timePattern: string } | null {
    const timePatterns = [
      /(\d{1,2})[:\s.](\d{2})/,
      /(\d{1,2})/,
    ];

    for (const pattern of timePatterns) {
      const match = text.match(pattern);
      if (match) {
        const hour = parseInt(match[1]);
        const minute = match[2] ? parseInt(match[2]) : 0;
        
        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
          return { hour, minute, timePattern: match[0] };
        }
      }
    }

    return null;
  }

  private extractActivity(text: string, timePattern: string): string {
    let activity = text.replace(timePattern, '').trim();
    
    activity = this.removeSingleLetters(activity);
    activity = this.removeExtraSpaces(activity);
    
    return activity;
  }

  private removeSingleLetters(text: string): string {
    return text
      .split(' ')
      .filter(word => word.length > 1)
      .join(' ');
  }

  private removeExtraSpaces(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .trim();
  }

  private capitalizeFirstLetter(text: string): string {
    if (!text) return text;
    
    const words = text.split(' ');
    const capitalizedWords = words.map((word, index) => {
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      
      const lowerWord = word.toLowerCase();
      
      if (this.isName(lowerWord)) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      
      return word.toLowerCase();
    });
    
    return capitalizedWords.join(' ');
  }

  private isName(word: string): boolean {
    const commonNames = [
      'ania', 'anna', 'adam', 'andrzej', 'basia', 'barbara', 'bartek', 'bartosz',
      'cecylia', 'cezary', 'darek', 'dariusz', 'ewa', 'edward', 'franek', 'franciszek',
      'gosia', 'malgosia', 'henryk', 'irena', 'jan', 'janusz', 'kasia', 'katarzyna',
      'lukasz', 'marek', 'maria', 'marta', 'mateusz', 'michal', 'monika', 'natalia',
      'ola', 'aleksandra', 'pawel', 'piotr', 'renata', 'robert', 'sylwia', 'tomek',
      'tomasz', 'ula', 'urszula', 'wojtek', 'wojciech', 'zosia', 'zofia'
    ];
    
    return commonNames.includes(word);
  }

  private createDate(hour: number, minute: number = 0, text: string): Date {
    const now = new Date();
    let targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);

    if (text.includes('tomorrow') || text.includes('jutro')) {
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (text.includes('day after tomorrow') || text.includes('pojutrze')) {
      targetDate.setDate(targetDate.getDate() + 2);
    } else if (text.includes('day after day after tomorrow') || text.includes('popojutrze')) {
      targetDate.setDate(targetDate.getDate() + 3);
    } else if (text.includes('yesterday') || text.includes('wczoraj')) {
      targetDate.setDate(targetDate.getDate() - 1);
    } else if (text.includes('day before yesterday') || text.includes('przedwczoraj')) {
      targetDate.setDate(targetDate.getDate() - 2);
    } else if (text.includes('monday') || text.includes('poniedzialek')) {
      targetDate = this.getNextWeekday(targetDate, 1);
    } else if (text.includes('tuesday') || text.includes('wtorek')) {
      targetDate = this.getNextWeekday(targetDate, 2);
    } else if (text.includes('wednesday') || text.includes('sroda')) {
      targetDate = this.getNextWeekday(targetDate, 3);
    } else if (text.includes('thursday') || text.includes('czwartek')) {
      targetDate = this.getNextWeekday(targetDate, 4);
    } else if (text.includes('friday') || text.includes('piatek')) {
      targetDate = this.getNextWeekday(targetDate, 5);
    } else if (text.includes('saturday') || text.includes('sobota')) {
      targetDate = this.getNextWeekday(targetDate, 6);
    } else if (text.includes('sunday') || text.includes('niedziela')) {
      targetDate = this.getNextWeekday(targetDate, 0);
    } else {
      if (targetDate <= now) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
    }

    return targetDate;
  }

  private getNextWeekday(targetDate: Date, weekday: number): Date {
    const currentDay = targetDate.getDay();
    const daysToAdd = weekday > currentDay ? weekday - currentDay : 7 - currentDay + weekday;
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    return targetDate;
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private async save(reminder: any): Promise<void> {
    console.log('Saving reminder:', reminder);
  }
} 
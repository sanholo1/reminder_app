import { ReminderRepositoryTypeORM, ReminderEntity } from '../repositories/reminder_repository_typeorm';
import { EmptyInputError, InvalidTimeError, EmptyActivityError, PastDateError } from '../exceptions/exception_handler';

export interface CreateReminderCommand {
  text: string;
}

export interface CreateReminderResult {
  activity: string;
  datetime: string;
}

export class CreateReminderHandler {
  private reminderRepository: ReminderRepositoryTypeORM;

  constructor() {
    this.reminderRepository = new ReminderRepositoryTypeORM();
  }

  async execute(command: CreateReminderCommand): Promise<CreateReminderResult> {
    const parsed = this.parseText(command.text);

    const clean = this.clearText(command.text.toLowerCase());
    const timeMatch = this.extractTime(clean);
    const { hour, minute } = timeMatch!;
    const datetime = this.createDate(hour, minute, command.text.toLowerCase());

    const reminder: ReminderEntity = {
      id: this.generateId(),
      activity: parsed.activity,
      datetime: datetime
    };

    await this.reminderRepository.create(reminder);
    return parsed;
  }

  private parseText(text: string): CreateReminderResult {
    const clean = this.clearText(text.toLowerCase());
    
    if (!clean.trim()) {
      throw new EmptyInputError();
    }

    const timeMatch = this.extractTime(clean);
    
    if (!timeMatch) {
      throw new InvalidTimeError();
    }

    const { hour, minute } = timeMatch;
    const activity = this.extractActivity(clean);

    if (!activity.trim()) {
      throw new EmptyActivityError();
    }

    const datetime = this.createDate(hour, minute, clean);

    if (datetime < new Date()) {
      throw new PastDateError();
    }

    return {
      activity: this.capitalizeFirstLetter(activity),
      datetime: datetime.toISOString()
    };
  }

  private clearText(text: string): string {
    return text.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
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

    const relativeTime = this.extractRelativeTime(text);
    if (relativeTime) {
      return relativeTime;
    }

    return null;
  }

  private extractRelativeTime(text: string): { hour: number; minute: number; timePattern: string } | null {
    const now = new Date();
    
    if (text.includes('za godzinę') || text.includes('za godzine')) {
      const futureTime = new Date(now.getTime() + 60 * 60 * 1000);
      return { 
        hour: futureTime.getHours(), 
        minute: futureTime.getMinutes(), 
        timePattern: 'za godzinę' 
      };
    }
    
    if (text.includes('za 2 godziny')) {
      const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      return { 
        hour: futureTime.getHours(), 
        minute: futureTime.getMinutes(), 
        timePattern: 'za 2 godziny' 
      };
    }
    
    if (text.includes('za 30 minut')) {
      const futureTime = new Date(now.getTime() + 30 * 60 * 1000);
      return { 
        hour: futureTime.getHours(), 
        minute: futureTime.getMinutes(), 
        timePattern: 'za 30 minut' 
      };
    }
    
    if (text.includes('wieczorem')) {
      return { hour: 20, minute: 0, timePattern: 'wieczorem' };
    }
    
    if (text.includes('rano')) {
      return { hour: 9, minute: 0, timePattern: 'rano' };
    }
    
    if (text.includes('w południe') || text.includes('w poludnie')) {
      return { hour: 12, minute: 0, timePattern: 'w południe' };
    }

    return null;
  }

  private extractActivity(text: string): string {
    let cleaned = text;

    cleaned = cleaned.replace(/\bo\s*\d{1,2}([:.,\s]\d{2})?(\s*(rano|wieczorem|południe|poludnie))?/gi, '');

    cleaned = cleaned.replace(/\bza\s*\d+\s*(dni|tygodni|miesi[ąa]ce?|godzin(y|e)?|minut(y|e)?)\b/gi, '');

    cleaned = cleaned.replace(/\bza\s*(tydzie[nń]|miesi[ąa]c|rok)\b/gi, '');

    cleaned = cleaned.replace(/\b(jutro|pojutrze|dzisiaj|dzis|popojutrze|wczoraj|przedwczoraj)\b/gi, '');

    cleaned = cleaned.replace(/\b(wieczorem|rano|w południe|w poludnie)\b/gi, '');

    cleaned = cleaned.replace(/\b(poniedzia[łl]ek|wtorek|[śs]roda|czwartek|pi[ąa]tek|sobota|niedziela|pon|wt|sr|czw|pt|sob|ndz)\b/gi, '');

    cleaned = cleaned.replace(/\b(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|wrze[śs]nia|pa[źz]dziernika|listopada|grudnia|styczen|luty|marzec|kwiecien|maj|czerwiec|lipiec|sierpien|wrzesien|pazdziernik|listopad|grudzien)\b/gi, '');

    cleaned = cleaned.replace(/\b\d{1,2}[.\/\-]\d{1,2}\b/gi, '');
    cleaned = cleaned.replace(/\b\d{1,2}\s+(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|wrze[śs]nia|pa[źz]dziernika|listopada|grudnia|styczen|luty|marzec|kwiecien|maj|czerwiec|lipiec|sierpien|wrzesien|pazdziernik|listopad|grudzien)\b/gi, '');

    cleaned = cleaned.replace(/\b20\d{2}\b/g, '');

    cleaned = cleaned.replace(/\b\d{1,2}\b/g, '');

    cleaned = this.removeSingleLetters(cleaned);
    cleaned = this.removeExtraSpaces(cleaned);
    return cleaned;
  }

  private removeSingleLetters(text: string): string {
    return text.split(' ').filter(word => word.length > 1).join(' ');
  }

  private removeExtraSpaces(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
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

    const calendarDate = this.extractCalendarDate(text);
    if (calendarDate) {
      return new Date(calendarDate.getFullYear(), calendarDate.getMonth(), calendarDate.getDate(), hour, minute, 0, 0);
    }

    const weekdays: { [key: string]: number } = {
      'niedziela': 0,
      'poniedziałek': 1, 'poniedzialek': 1,
      'wtorek': 2,
      'środa': 3, 'sroda': 3,
      'czwartek': 4,
      'piątek': 5, 'piatek': 5,
      'sobota': 6
    };
    for (const [name, num] of Object.entries(weekdays)) {
      if (text.includes(name)) {
        const today = now.getDay();
        let daysToAdd = (num - today + 7) % 7;
        if (daysToAdd === 0 && (hour < now.getHours() || (hour === now.getHours() && minute <= now.getMinutes()))) {
          daysToAdd = 7;
        }
        targetDate.setDate(now.getDate() + daysToAdd);
        return targetDate;
      }
    }

    if (text.includes('jutro')) {
      targetDate.setDate(now.getDate() + 1);
      return targetDate;
    } else if (text.includes('pojutrze')) {
      targetDate.setDate(now.getDate() + 2);
      return targetDate;
    } else if (text.includes('popojutrze')) {
      targetDate.setDate(now.getDate() + 3);
      return targetDate;
    } else if (text.includes('wczoraj')) {
      targetDate.setDate(now.getDate() - 1);
      return targetDate;
    } else if (text.includes('przedwczoraj')) {
      targetDate.setDate(now.getDate() - 2);
      return targetDate;
    }

    if (targetDate <= now) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    return targetDate;
  }

  private extractCalendarDate(text: string): Date | null {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    const monthNames: { [key: string]: number } = {
      'stycznia': 0, 'lutego': 1, 'marca': 2, 'kwietnia': 3, 'maja': 4, 'czerwca': 5,
      'lipca': 6, 'sierpnia': 7, 'września': 8, 'października': 9, 'listopada': 10, 'grudnia': 11,
      'wrzesnia': 8, 'pazdziernika': 9
    };

    const datePatterns = [
      /(\d{1,2})\s+(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)/i,
      /(\d{1,2})\.(\d{1,2})/,
      /(\d{1,2})\/(\d{1,2})/
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        if (pattern.source.includes('stycznia|lutego')) {
          const day = parseInt(match[1]);
          const monthName = match[2].toLowerCase();
          const month = monthNames[monthName];
          
          if (month !== undefined && day >= 1 && day <= 31) {
            const targetDate = new Date(currentYear, month, day);
            if (targetDate < now) {
              targetDate.setFullYear(currentYear + 1);
            }
            return targetDate;
          }
        } else {
          const day = parseInt(match[1]);
          const month = parseInt(match[2]) - 1;
          
          if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
            const targetDate = new Date(currentYear, month, day);
            if (targetDate < now) {
              targetDate.setFullYear(currentYear + 1);
            }
            return targetDate;
          }
        }
      }
    }

    if (text.includes('za tydzień') || text.includes('za tydzien')) {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    if (text.includes('za miesiąc') || text.includes('za miesiac')) {
      return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }

    return null;
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

  private createDateFromFormatted(formatted: string): Date {
    const regex = /\d{1,2} (stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia) (\d{2}):(\d{2})/i;
    const match = formatted.match(regex);
    if (match) {
      const day = parseInt(match[1]);
      const monthName = match[2].toLowerCase();
      const hour = parseInt(match[3]);
      const minute = parseInt(match[4]);
      const monthNames: { [key: string]: number } = {
        'stycznia': 0, 'lutego': 1, 'marca': 2, 'kwietnia': 3, 'maja': 4, 'czerwca': 5,
        'lipca': 6, 'sierpnia': 7, 'września': 8, 'października': 9, 'listopada': 10, 'grudnia': 11,
        'wrzesnia': 8, 'pazdziernika': 9
      };
      const month = monthNames[monthName];
      const now = new Date();
      return new Date(now.getFullYear(), month, day, hour, minute, 0, 0);
    }
    return new Date();
  }
} 
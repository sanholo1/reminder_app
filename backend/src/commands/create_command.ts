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
      return { activity: parsed.activity, datetime: '', error: parsed.error };
    }

    const reminder = {
      id: this.generateId(),
      activity: parsed.activity, // już bez końcówki czasowej
      datetime: this.createDateFromFormatted(parsed.datetime)
    };

    await this.saveToDatabase(reminder);
    return parsed;
  }

  private async saveToDatabase(reminder: any): Promise<void> {
    const query = `
      INSERT INTO reminders (id, activity, datetime) 
      VALUES (?, ?, ?)
    `;
    
    await pool.execute(query, [
      reminder.id,
      reminder.activity,
      reminder.datetime
    ]);
  }

  private parseText(text: string): CreateResult {
    const clean = this.clearText(text.toLowerCase());
    
    if (!clean.trim()) {
      return { activity: '', datetime: '', error: 'Wprowadź aktywność i czas' };
    }

    const timeMatch = this.extractTime(clean);
    
    if (!timeMatch) {
      return { activity: '', datetime: '', error: 'Podaj prawidłowy czas z aktywnością' };
    }

    const { hour, minute, timePattern } = timeMatch;
    const activity = this.extractActivity(clean, timePattern);

    if (!activity.trim()) {
      return { activity: '', datetime: '', error: 'Podaj o czym chcesz być przypomniany' };
    }

    const datetime = this.createDate(hour, minute, clean);

    if (datetime < new Date()) {
      return { activity: '', datetime: '', error: 'Nie można tworzyć przypomnień dla dat z przeszłości' };
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

  private parseDateTime(dateTimeString: string): Date {
    const date = new Date();
    const parts = dateTimeString.split(', ');
    
    if (parts.length >= 2) {
      const datePart = parts[0];
      const timePart = parts[1];
      
      const dateMatch = datePart.match(/(\d+) (\w+)/);
      const timeMatch = timePart.match(/(\d{2}):(\d{2})/);
      
      if (dateMatch && timeMatch) {
        const day = parseInt(dateMatch[1]);
        const monthName = dateMatch[2];
        const hour = parseInt(timeMatch[1]);
        const minute = parseInt(timeMatch[2]);
        
        const monthNames: { [key: string]: number } = {
          'stycznia': 0, 'lutego': 1, 'marca': 2, 'kwietnia': 3, 'maja': 4, 'czerwca': 5,
          'lipca': 6, 'sierpnia': 7, 'września': 8, 'października': 9, 'listopada': 10, 'grudnia': 11,
          'wrzesnia': 8, 'pazdziernika': 9
        };
        
        const month = monthNames[monthName.toLowerCase()];
        if (month !== undefined) {
          return new Date(date.getFullYear(), month, day, hour, minute, 0, 0);
        }
      }
    }
    
    return new Date();
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

  private extractActivity(text: string, timePattern: string): string {
    let activity = text.replace(timePattern, '').trim();
    // Zamiana polskich znaków na zwykłe litery
    const normalize = (str: string) => str
      .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l')
      .replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z');
    const normalizedActivity = normalize(activity.toLowerCase());
    // Dni tygodnia i określenia czasowe (z polskimi znakami i bez)
    const dayWords = [
      'poniedzialek', 'wtorek', 'sroda', 'czwartek', 'piatek', 'sobota', 'niedziela',
      'pon', 'wt', 'sr', 'czw', 'pt', 'sob', 'ndz',
      'jutro', 'pojutrze', 'dzisiaj', 'dzis', 'popojutrze', 'wczoraj', 'przedwczoraj'
    ];
    let cleaned = activity;
    dayWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      cleaned = cleaned.replace(regex, '');
      // Usuwaj także wersje z polskimi znakami
      const plWord = word
        .replace('sroda', 'środa')
        .replace('piatek', 'piątek')
        .replace('poniedzialek', 'poniedziałek');
      if (plWord !== word) {
        const regexPl = new RegExp(`\\b${plWord}\\b`, 'gi');
        cleaned = cleaned.replace(regexPl, '');
      }
    });
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

    // Dni tygodnia
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
        // Jeśli dziś jest ten dzień tygodnia, ale godzina już minęła, ustaw na następny tydzień
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

    // Jeśli nie podano dnia, a godzina już minęła, ustaw na jutro
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

  // Pomocnicza funkcja do konwersji sformatowanego stringa na Date
  private createDateFromFormatted(formatted: string): Date {
    // Przykład: "poniedziałek, 21 lipca 16:35"
    // Wyciągamy dzień, miesiąc, godzinę, minutę
    const regex = /\d{1,2} (stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia) (\d{2}):(\d{2})/i;
    const match = formatted.match(regex);
    if (match) {
      const day = parseInt(match[0]);
      const monthName = match[1].toLowerCase();
      const hour = parseInt(match[2]);
      const minute = parseInt(match[3]);
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
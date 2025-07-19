import express from 'express';

const app = express();
const port = 3001;

app.use(express.json());

const WEEKDAYS: { [key: string]: number } = {
  'poniedziałek': 1, 'poniedzialek': 1, 'pon': 1,
  'wtorek': 2, 'wto': 2,
  'środa': 3, 'sroda': 3, 'śr': 3, 'sr': 3,
  'czwartek': 4, 'czw': 4,
  'piątek': 5, 'piatek': 5, 'pt': 5,
  'sobota': 6, 'sob': 6,
  'niedziela': 0, 'nie': 0
};

const MONTHS: { [key: string]: number } = {
  'styczeń': 0, 'styczen': 0, 'sty': 0,
  'luty': 1, 'lut': 1,
  'marzec': 2, 'mar': 2,
  'kwiecień': 3, 'kwiecien': 3, 'kwi': 3,
  'maj': 4,
  'czerwiec': 5, 'cze': 5,
  'lipiec': 6, 'lip': 6,
  'sierpień': 7, 'sierpien': 7, 'sie': 7,
  'wrzesień': 8, 'wrzesien': 8, 'wrz': 8,
  'październik': 9, 'pazdziernik': 9, 'paź': 9, 'paz': 9,
  'listopad': 10, 'lis': 10,
  'grudzień': 11, 'grudzien': 11, 'gru': 11
};

const DATE_FORMAT_OPTIONS = {
  year: 'numeric' as const,
  month: '2-digit' as const,
  day: '2-digit' as const,
  hour: '2-digit' as const,
  minute: '2-digit' as const,
  timeZone: 'Europe/Warsaw' as const
};

function clearText(text: string): string {
  return text
    .replace(/jutro|pojutrze|popojutrze|za\s+(tydzień|tygodnie?|godzinę?|godziny?|minutę?|minuty?|dni?|dzień)/gi, '')
    .replace(/przypomnij\s+mi\s+o\s+|nie\s+zapomnij\s+o\s+/gi, '')
    .replace(/\b(w|o|na|o\s+godz|o\s+godzinie|o\s+godzine)\b/gi, '')
    .replace(/\d{1,2}[:.\s]\d{2}/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function capitalizeFirstLetter(text: string): string {
  if (!text || text.length === 0) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function createDate(baseDate: Date, days: number, hours: number, minutes: number): Date {
  return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + days, hours, minutes, 0, 0);
}

function getNextWeekday(weekdayName: string): Date {
  const targetDay = WEEKDAYS[weekdayName.toLowerCase()];
  if (targetDay === undefined) {
    throw new Error(`Unknown weekday: ${weekdayName}`);
  }
  
  const now = new Date();
  const currentDay = now.getDay();
  let daysToAdd = targetDay - currentDay;
  
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }
  
  return createDate(now, daysToAdd, 0, 0);
}

function getMonthNumber(monthName: string): number {
  const month = MONTHS[monthName.toLowerCase()];
  if (month === undefined) {
    throw new Error(`Unknown month: ${monthName}`);
  }
  return month;
}

function createDateTime(hour: number, minute: number, matches: {
  tomorrow?: RegExpMatchArray | null;
  dayAfterTomorrow?: RegExpMatchArray | null;
  dayAfterDayAfterTomorrow?: RegExpMatchArray | null;
  weekday?: RegExpMatchArray | null;
  week?: RegExpMatchArray | null;
  hourOffset?: RegExpMatchArray | null;
  minuteOffset?: RegExpMatchArray | null;
  dayOffset?: RegExpMatchArray | null;
  calendarDate?: RegExpMatchArray | null;
  timeOfDay?: RegExpMatchArray | null;
}): string {
  const now = new Date();
  let date: Date;

  if (matches.tomorrow) {
    date = createDate(now, 1, hour, minute);
  } else if (matches.dayAfterTomorrow) {
    date = createDate(now, 2, hour, minute);
  } else if (matches.dayAfterDayAfterTomorrow) {
    date = createDate(now, 3, hour, minute);
  } else if (matches.weekday) {
    const weekdayName = matches.weekday[2] || matches.weekday[1];
    const targetDate = getNextWeekday(weekdayName);
    date = createDate(targetDate, 0, hour, minute);
  } else if (matches.week) {
    const weekCount = matches.week[1] ? parseInt(matches.week[1]) : 1;
    date = createDate(now, weekCount * 7, hour, minute);
  } else if (matches.hourOffset) {
    const hourOffset = matches.hourOffset[1] ? parseInt(matches.hourOffset[1]) : 1;
    date = new Date(now.getTime() + (hourOffset * 60 * 60 * 1000));
    date.setHours(hour, minute, 0, 0);
  } else if (matches.minuteOffset) {
    const minuteOffset = matches.minuteOffset[1] ? parseInt(matches.minuteOffset[1]) : 1;
    date = new Date(now.getTime() + (minuteOffset * 60 * 1000));
    date.setHours(hour, minute, 0, 0);
  } else if (matches.dayOffset) {
    const dayOffset = matches.dayOffset[1] ? parseInt(matches.dayOffset[1]) : 1;
    date = createDate(now, dayOffset, hour, minute);
  } else if (matches.calendarDate) {
    const day = parseInt(matches.calendarDate[1]);
    const monthName = matches.calendarDate[2];
    const month = getMonthNumber(monthName);
    const year = now.getFullYear();
    date = new Date(year, month, day, hour, minute, 0, 0);
    
    if (date < now) {
      date.setFullYear(year + 1);
    }
  } else if (matches.timeOfDay) {
    const timeOfDay = matches.timeOfDay[1];
    
    if (timeOfDay === 'południe') {
      date = createDate(now, 0, 12, 0);
    } else if (timeOfDay === 'północy') {
      date = createDate(now, 0, 0, 0);
    } else {
      date = createDate(now, 0, hour, minute);
    }
  } else {
    date = createDate(now, 0, hour, minute);
  }
  
  return date.toLocaleString('pl-PL', DATE_FORMAT_OPTIONS);
}

function validateTime(hour: number, minute: number): string | null {
  if (hour > 23 || minute > 59) {
    return `Invalid time ${hour}:${minute}. Please use format HH:MM (0-23:0-59).`;
  }
  return null;
}

function validateHour(hour: number): string | null {
  if (hour > 23) {
    return `Invalid hour ${hour}. Please use 0-23.`;
  }
  return null;
}

function validatePastDate(datetime: string): string | null {
  const parsedDate = new Date(datetime);
  const now = new Date();
  
  if (parsedDate <= now) {
    return "Cannot set reminder for past date. Please choose a future date and time.";
  }
  return null;
}

app.post('/parse', (req, res) => {
  const { text } = req.body;
  let activity = text;
  let datetime: string | null = null;
  let error: string | null = null;

  if (typeof text === 'string') {
    const matches = {
      tomorrow: text.match(/jutro/i),
      dayAfterTomorrow: text.match(/pojutrze/i),
      dayAfterDayAfterTomorrow: text.match(/popojutrze/i),
      weekday: text.match(/\b(w\s+)?(poniedziałek|poniedzialek|pon|wtorek|wto|środa|sroda|śr|sr|czwartek|czw|piątek|piatek|pt|sobota|sob|niedziela|nie)\b/i),
      week: text.match(/za\s+(\d+)?\s*tydzień/i),
      hourOffset: text.match(/za\s+(\d+)?\s*godzinę?/i),
      minuteOffset: text.match(/za\s+(\d+)?\s*minutę?/i),
      dayOffset: text.match(/za\s+(\d+)?\s*dzień/i),
      calendarDate: text.match(/(\d{1,2})\s+(styczeń|styczen|sty|luty|lut|marzec|mar|kwiecień|kwiecien|kwi|maj|czerwiec|cze|lipiec|lip|sierpień|sierpien|sie|wrzesień|wrzesien|wrz|październik|pazdziernik|paź|paz|listopad|lis|grudzień|grudzien|gru)/i),
      timeOfDay: text.match(/\b(rano|wieczorem|południe|północy)\b/i)
    };

    const hourMatch = text.match(/(\d{1,2})[:.\s](\d{2})/);
    const singleHourMatch = text.match(/\b(\d{1,2})\b/);

    if (hourMatch) {
      const [_, h, m] = hourMatch;
      const hour = Number(h);
      const minute = Number(m);
      
      error = validateTime(hour, minute);
      if (!error) {
        datetime = createDateTime(hour, minute, matches);
        activity = capitalizeFirstLetter(clearText(text.split(hourMatch[0])[0]));
      }
    } else if (singleHourMatch) {
      const hour = Number(singleHourMatch[1]);
      const minute = 0;
      
      error = validateHour(hour);
      if (!error) {
        datetime = createDateTime(hour, minute, matches);
        activity = capitalizeFirstLetter(clearText(text.split(singleHourMatch[0])[0]));
      }
    } else {
      activity = capitalizeFirstLetter(clearText(text));
    }

    const hasTime = hourMatch || singleHourMatch;
    const hasActivity = activity && activity.trim().length > 0;

    if (!error) {
      if (!hasTime && !hasActivity) {
        error = "Please provide both activity and time.";
      } else if (!hasTime) {
        error = "Please provide time";
      } else if (!hasActivity) {
        error = "Please provide activity.";
      } else if (datetime) {
        error = validatePastDate(datetime);
      }
    }
  }

  res.json({ activity, datetime, error });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
}); 

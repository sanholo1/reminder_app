import { DateTime } from 'luxon';
import OpenAI from 'openai';
import { config } from '../config/environment';
import {
  AbuseError,
  DuplicateDataError,
  InvalidGPTConversationError,
  InvalidTimeFormatError,
  NoActivityAndTimeError,
  NoActivityError,
  NoTimeError,
  PastTimeError,
} from '../exceptions/exception_handler';
import { UserSessionService } from './user_session_service';

export interface LLMParseResult {
  activity: string;
  datetime: string;
}

export interface LLMErrorResult {
  error: string;
}

export interface LLMAbuseResult {
  error: string;
  remainingAttempts: number;
  isBlocked: boolean;
}

export interface LLMTimePattern {
  activity: string;
  timePattern: string;
}

export class LLMParserService {
  private openai: OpenAI;
  private userSessionService: UserSessionService;

  constructor() {
    this.openai = new OpenAI({ apiKey: config.services.openaiApiKey });
    this.userSessionService = new UserSessionService();
  }

  async parseReminderText(
    text: string,
    sessionId?: string
  ): Promise<LLMParseResult | LLMErrorResult | LLMAbuseResult> {
    try {
      const abuseCheck = await this.checkForAbuse(text, sessionId);
      if (abuseCheck) {
        return abuseCheck;
      }

      if (sessionId) {
        const dailyUsageCheck = await this.userSessionService.checkDailyUsageLimit(sessionId);
        if (!dailyUsageCheck.canUse) {
          return {
            error: `Przekroczono dzienny limit użycia (${dailyUsageCheck.maxDailyUsage} na dzień). Limit zostanie zresetowany o północy. Możesz spróbować ponownie jutro.`,
            remainingAttempts: 0,
            isBlocked: true,
          };
        }
      }

      const normalizedText = this.normalizeInput(text);
      const prompt = this.buildPrompt(normalizedText);
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert text parser for reminder applications. Your task is to extract the activity and time pattern from user input. Return ONLY valid JSON - no additional text, no code blocks, no explanations. Format: {"activity": "...", "timePattern": "..."}. If there is an error, return {"error": "ERROR_CODE"} where ERROR_CODE is one of: NO_ACTIVITY_AND_TIME, NO_TIME, NO_ACTIVITY, INVALID_TIME_FORMAT, PAST_TIME, DUPLICATE_DATA.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 200,
      });
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Brak odpowiedzi od LLM');
      }
      const patternResult = this.parseLLMResponse(content);
      if ('error' in patternResult) {
        return patternResult;
      }

      const datetime = this.convertTimePatternToDateTime(patternResult.timePattern);
      if (!datetime) {
        return { error: 'Nie można ustawić przypomnienia w przeszłości' };
      }

      if (sessionId) {
        await this.userSessionService.recordDailyUsage(sessionId);
      }

      return { activity: patternResult.activity, datetime };
    } catch (error) {
      if (
        error instanceof InvalidGPTConversationError ||
        error instanceof NoTimeError ||
        error instanceof NoActivityError ||
        error instanceof PastTimeError ||
        error instanceof NoActivityAndTimeError ||
        error instanceof InvalidTimeFormatError ||
        error instanceof DuplicateDataError ||
        error instanceof AbuseError
      ) {
        throw error;
      }
      throw new Error('Nie udało się sparsować tekstu przez AI');
    }
  }

  private normalizeInput(text: string): string {
    // Convert Polish and English number words to digits
    const numberMappings: { [key: string]: number } = {
      // English
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
      'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
      'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60,
      // Polish
      'jeden': 1, 'dwa': 2, 'trzy': 3, 'cztery': 4, 'pięć': 5,
      'sześć': 6, 'siedem': 7, 'osiem': 8, 'dziewięć': 9, 'dziesięć': 10,
      'jedenaście': 11, 'dwanaście': 12, 'trzynaście': 13, 'czternaście': 14, 'piętnaście': 15,
      'szesnaście': 16, 'siedemnaście': 17, 'osiemnaście': 18, 'dziewiętnaście': 19, 'dwadzieścia': 20,
      'trzydzieści': 30, 'czterdzieści': 40, 'pięćdziesiąt': 50, 'sześćdziesiąt': 60,
    };

    let normalized = text.toLowerCase().trim();
    
    // Handle special fractions (half, pół, etc.)
    normalized = normalized.replace(/\bhalf\s*(hour|godzina)\b/gi, '0:30');
    normalized = normalized.replace(/\bpół\s*(godziny|godzin|godzinie)\b/gi, '0:30');
    normalized = normalized.replace(/\bpół\b(?=\s*(?:godziny|godzin|godzinie))/gi, '30 minutes');

    // Replace number words with digits
    for (const [word, num] of Object.entries(numberMappings)) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      normalized = normalized.replace(regex, num.toString());
    }

    // Replace common time expressions
    normalized = normalized.replace(/\bo'clock\b/gi, '');
    normalized = normalized.replace(/\bam\b|\bpm\b/gi, '');
    normalized = normalized.replace(/\ba\.m\.\b|\bp\.m\.\b/gi, '');
    normalized = normalized.replace(/\brano\b|\bwieczorem\b|\bnoc\b/gi, '');
    
    // Normalize spacing (multiple spaces to single space)
    normalized = normalized.replace(/\s+/g, ' ');
    
    // Handle edge cases with slash or dash separated times
    normalized = normalized.replace(/(\d{1,2})[\/\-:](\d{1,2})\s*(am|pm)?/gi, '$1:$2');

    return normalized;
  }

  private async checkForAbuse(text: string, sessionId?: string): Promise<LLMAbuseResult | null> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at detecting abuse in a reminder application.
Your task is to determine if the user is using the application as intended (creating reminders).
The application is designed ONLY for creating reminders based on natural language input.

APPLICATION PURPOSE:
The app allows users to set reminders by specifying:
- An activity/task to be reminded about
- A time for the reminder (in X hours/minutes, tomorrow at X, next Monday at X, etc.)

WHAT CONSTITUTES ABUSE:
Abuse includes attempts to use the app for purposes OTHER than creating reminders:
- Personal questions ("How are you?", "Tell me a joke")
- Requests for help unrelated to reminders ("Help me with math", "How do I code?")
- Requests for information ("What's the weather?", "What day is it?")
- Opinion requests ("What do you think about politics?")
- Creative requests unrelated to reminders ("Write me a poem", "Draw a picture")
- Random/nonsensical input ("asdadwasdwd", "123123QSWDSD")
- Any attempt to interact with the AI beyond reminder creation
- Calculations or translations

WHAT IS NOT ABUSE (These are valid reminder attempts - handle them as errors in the main parser):
- Attempting to set a reminder in the past ("remind me yesterday at 3pm") → VALID ATTEMPT, NOT ABUSE
- Attempting to set a reminder with missing info ("remind me tomorrow") → VALID ATTEMPT, NOT ABUSE
- Ambiguous activity names ("do the thing tomorrow at 5pm") → VALID ATTEMPT, NOT ABUSE
- Any input where the user's INTENT is clearly to create a reminder, even if the format is wrong

CRITICAL RULE:
Only return true if you are 100% certain the user is trying to abuse the system.
Default to false (not abuse) when in doubt. Users have freedom in how they describe their reminders.

RESPONSE FORMAT:
Return ONLY valid JSON with no additional text:
{"isAbuse": true/false}`,
          },
          {
            role: 'user',
            content: `Check if this is abuse: "${text}"`,
          },
        ],
        temperature: 0.1,
        max_tokens: 100,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return null;
      }

      const cleanResponse = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);

      if (parsed.isAbuse && sessionId) {
        const attemptResult = await this.userSessionService.recordAttempt(sessionId, true);

        if (attemptResult.isBlocked) {
          return {
            error: 'Twoje konto zostało zablokowane na 24 godziny z powodu nieprawidłowego użycia.',
            remainingAttempts: 0,
            isBlocked: true,
          };
        } else {
          return {
            error: `To pytanie nie dotyczy tworzenia przypomnień. Używaj aplikacji tylko do ustawiania przypomnień. Pozostało ${attemptResult.remainingAttempts} prób przed zablokowaniem.`,
            remainingAttempts: attemptResult.remainingAttempts,
            isBlocked: false,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error checking for abuse:', error);
      return null;
    }
  }

  private buildPrompt(text: string): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const hour = now.getHours();
    const minute = now.getMinutes();

    return `Extract reminder activity and time pattern from the user input.

YOUR TASK:
1. Extract the ACTIVITY (what the user wants to be reminded about)
2. Extract the TIME PATTERN (when the reminder should occur)
3. Return ONLY valid JSON format - no additional text

MANDATORY VALIDATION RULES:
1. Return ONLY exact time patterns from the ALLOWED TIME PATTERNS list below
2. If both activity AND time are missing → error: "NO_ACTIVITY_AND_TIME"
3. If time is missing → error: "NO_TIME"
4. If activity is missing → error: "NO_ACTIVITY"
5. If time format is invalid → error: "INVALID_TIME_FORMAT"
6. If user specifies multiple different activities OR multiple different times/dates → error: "DUPLICATE_DATA"
7. If time indicates the PAST (yesterday, last Monday, 30 minutes ago, etc.) → error: "PAST_TIME"
8. If hour is specified alone without a date and that hour already passed today → set for tomorrow at that hour

TIME FORMAT VALIDATION RULES:
- Valid hour formats: 0-23 (24-hour format)
- Valid minute formats: 0-59
- If only hour given without minutes (e.g., "at 14") → convert to "14:00"
- Invalid formats: "25:00", "14:60", "99", "25:30", "-5:00", "25h", etc.

ALLOWED TIME PATTERNS (use ONLY these - no other variations):
- "+HH:MM" - in X hours and minutes (e.g., "+00:30", "+02:15", "+05:05")
- "jutro HH:MM" - tomorrow at specific time (e.g., "jutro 15:00", "jutro 09:00")
- "po jutrze HH:MM" - day after tomorrow at time (e.g., "po jutrze 15:00")
- "pojutrze HH:MM" - day after tomorrow at time (e.g., "pojutrze 15:00")
- "dziś HH:MM" - today at specific time (e.g., "dziś 15:00", "dziś 08:00")
- "za X dni HH:MM" - in X days at time (e.g., "za 3 dni 14:00", "za 5 dni 10:30")
- "poniedziałek HH:MM" through "niedziela HH:MM" - specific day of week at time (e.g., "poniedziałek 08:00")
- "za tydzień HH:MM" - in one week at time (e.g., "za tydzień 15:00")
- "za tydzień dzień HH:MM" - in one week on specific day (e.g., "za tydzień poniedziałek 12:00")
- "za X tygodnie dzień HH:MM" - in X weeks on day at time (e.g., "za 2 tygodnie piątek 18:00")

TIME CONVERSION EXAMPLES:
- "in 2 hours" / "za 2 godziny" → "+02:00"
- "in 1 hour" / "za godzinę" → "+01:00"
- "in 15 minutes" / "za 15 minut" → "+00:15"
- "in 1.5 hours" / "za godzinę i 30 minut" → "+01:30"
- "tomorrow at 9am" / "jutro o 9 rano" → "jutro 09:00"
- "Monday at 8am" / "w poniedziałek o 8" → "poniedziałek 08:00"
- "in 3 days at 2pm" / "za 3 dni o 14" → "za 3 dni 14:00"
- "in 2 weeks on Friday at 6pm" / "za 2 tygodnie w piątek o 18" → "za 2 tygodnie piątek 18:00"

EDGE CASE - Hour without date:
- "meeting at 3pm" when current time is 2pm → "dziś 15:00"
- "meeting at 3pm" when current time is 4pm → "jutro 15:00"
- "remind me at 14" when current time is 13:30 → "dziś 14:00"
- "remind me at 14" when current time is 14:30 → "jutro 14:00"

RESPONSE FORMAT:
- Return ONLY valid JSON, no markdown code blocks, no extra text
- Use lowercase for time patterns
- Use Polish characters as specified in patterns above

Current date/time for context: ${today} ${pad(hour)}:${pad(minute)}

User input: "${text}"

EXAMPLES:

Input: "remind me to feed the cat in 2 hours"
Output: {"activity": "feed the cat", "timePattern": "+02:00"}

Input: "buy groceries tomorrow at 10am"
Output: {"activity": "buy groceries", "timePattern": "jutro 10:00"}

Input: "meeting on Monday at 9"
Output: {"activity": "meeting", "timePattern": "poniedziałek 09:00"}

Input: "call mom in 3 days at 2pm"
Output: {"activity": "call mom", "timePattern": "za 3 dni 14:00"}

Input: "gym session day after tomorrow at 6pm"
Output: {"activity": "gym session", "timePattern": "po jutrze 18:00"}

Input: "in 2 weeks on Friday dinner at 7pm"
Output: {"activity": "dinner", "timePattern": "za 2 tygodnie piątek 19:00"}

Input: "remind me"
Output: {"error": "NO_ACTIVITY_AND_TIME"}

Input: "meeting tomorrow"
Output: {"error": "NO_TIME"}

Input: "at 3pm"
Output: {"error": "NO_ACTIVITY"}

Input: "was supposed to do this yesterday at 5"
Output: {"error": "PAST_TIME"}

Input: "meeting at 25:00"
Output: {"error": "INVALID_TIME_FORMAT"}

Input: "meeting at 14:60"
Output: {"error": "INVALID_TIME_FORMAT"}

Input: "lunch at 12 and dinner at 19"
Output: {"error": "DUPLICATE_DATA"}

Input: "workout tomorrow and next Monday"
Output: {"error": "DUPLICATE_DATA"}

Return ONLY JSON.`;
  }

  private parseLLMResponse(response: string): LLMTimePattern | LLMErrorResult {
    try {
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);

      if (parsed.error) {
        switch (parsed.error) {
          case 'NO_TIME':
            throw new NoTimeError();
          case 'NO_ACTIVITY':
            throw new NoActivityError();
          case 'PAST_TIME':
            throw new PastTimeError();
          case 'NO_ACTIVITY_AND_TIME':
            throw new NoActivityAndTimeError();
          case 'INVALID_TIME_FORMAT':
            throw new InvalidTimeFormatError();
          case 'DUPLICATE_DATA':
            throw new DuplicateDataError();
          default:
            return { error: parsed.error };
        }
      }

      if (!parsed.activity || !parsed.timePattern) {
        throw new NoActivityAndTimeError();
      }

      return { activity: parsed.activity, timePattern: parsed.timePattern };
    } catch (error) {
      if (
        error instanceof NoTimeError ||
        error instanceof NoActivityError ||
        error instanceof PastTimeError ||
        error instanceof NoActivityAndTimeError ||
        error instanceof InvalidTimeFormatError ||
        error instanceof DuplicateDataError
      ) {
        throw error;
      }
      return { error: 'Nieprawidłowa odpowiedź od AI' };
    }
  }

  private convertTimePatternToDateTime(timePattern: string): string | null {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = DateTime.now();
    const nowZoned = now.setZone(userTimeZone);
    const normalized = timePattern.trim().toLowerCase().replace(/\s+/g, ' ');
    const dayNames = [
      'poniedziałek',
      'wtorek',
      'środa',
      'czwartek',
      'piątek',
      'sobota',
      'niedziela',
    ];

    const newFormatMatch = normalized.match(/^([+-])(\d{2}):(\d{2})$/);

    if (newFormatMatch) {
      console.log(`[LLM Parser] Text matched new format pattern: ${timePattern}`);
      const sign = newFormatMatch[1];
      const hours = parseInt(newFormatMatch[2]);
      const minutes = parseInt(newFormatMatch[3]);

      // Validate hours and minutes
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.log(`[LLM Parser] Invalid time values: ${hours}:${minutes}`);
        return null;
      }

      if (sign === '-') {
        console.log(`[LLM Parser] Past time detected: ${timePattern}`);
        return null;
      } else if (sign === '+') {
        const targetTime = nowZoned.plus({ hours, minutes });
        return targetTime.toISO();
      }
    }

    const tomorrowMatch = normalized.match(/^jutro (\d{1,2})(?::(\d{2}))?$/);
    if (tomorrowMatch) {
      console.log(`[LLM Parser] Text matched tomorrow pattern: ${timePattern}`);
      const hours = parseInt(tomorrowMatch[1]);
      const minutes = tomorrowMatch[2] ? parseInt(tomorrowMatch[2]) : 0;
      
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.log(`[LLM Parser] Invalid time values: ${hours}:${minutes}`);
        return null;
      }

      const tomorrow = nowZoned.plus({ days: 1 });
      const targetTime = tomorrow.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
      return targetTime.toISO();
    }

    const daysMatch = normalized.match(/^za (\d+) dni (\d{1,2})(?::(\d{2}))?$/);
    if (daysMatch) {
      console.log(`[LLM Parser] Text matched days pattern: ${timePattern}`);
      const days = parseInt(daysMatch[1]);
      const hours = parseInt(daysMatch[2]);
      const minutes = daysMatch[3] ? parseInt(daysMatch[3]) : 0;
      
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.log(`[LLM Parser] Invalid time values: ${hours}:${minutes}`);
        return null;
      }

      const targetDate = nowZoned.plus({ days });
      const targetTime = targetDate.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
      return targetTime.toISO();
    }

    const dayAfterTomorrowMatch = normalized.match(/^po jutrze (\d{1,2})(?::(\d{2}))?$/);
    if (dayAfterTomorrowMatch) {
      console.log(`[LLM Parser] Text matched day after tomorrow pattern: ${timePattern}`);
      const hours = parseInt(dayAfterTomorrowMatch[1]);
      const minutes = dayAfterTomorrowMatch[2] ? parseInt(dayAfterTomorrowMatch[2]) : 0;
      
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.log(`[LLM Parser] Invalid time values: ${hours}:${minutes}`);
        return null;
      }

      const dayAfterTomorrow = nowZoned.plus({ days: 2 });
      const targetTime = dayAfterTomorrow.set({
        hour: hours,
        minute: minutes,
        second: 0,
        millisecond: 0,
      });
      return targetTime.toISO();
    }

    const pojutrzeMatch = normalized.match(/^pojutrze (\d{1,2})(?::(\d{2}))?$/);
    if (pojutrzeMatch) {
      console.log(`[LLM Parser] Text matched pojutrze pattern: ${timePattern}`);
      const hours = parseInt(pojutrzeMatch[1]);
      const minutes = pojutrzeMatch[2] ? parseInt(pojutrzeMatch[2]) : 0;
      
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.log(`[LLM Parser] Invalid time values: ${hours}:${minutes}`);
        return null;
      }

      const dayAfterTomorrow = nowZoned.plus({ days: 2 });
      const targetTime = dayAfterTomorrow.set({
        hour: hours,
        minute: minutes,
        second: 0,
        millisecond: 0,
      });
      return targetTime.toISO();
    }

    const todayMatch = normalized.match(/^dzi(?:ś|s(?:iaj)?) (\d{1,2})(?::(\d{2}))?$/);
    if (todayMatch) {
      console.log(`[LLM Parser] Text matched today pattern: ${timePattern}`);
      const hours = parseInt(todayMatch[1]);
      const minutes = todayMatch[2] ? parseInt(todayMatch[2]) : 0;
      
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.log(`[LLM Parser] Invalid time values: ${hours}:${minutes}`);
        return null;
      }

      let targetTime = nowZoned.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });

      if (targetTime <= nowZoned) {
        targetTime = targetTime.plus({ days: 1 });
      }

      return targetTime.toISO();
    }

    const plainTimeMatch = normalized.match(/^(\d{1,2}):(\d{2})$/);
    if (plainTimeMatch) {
      console.log(`[LLM Parser] Text matched plain time pattern: ${timePattern}`);
      const hours = parseInt(plainTimeMatch[1]);
      const minutes = parseInt(plainTimeMatch[2]);
      
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.log(`[LLM Parser] Invalid time values: ${hours}:${minutes}`);
        return null;
      }

      let targetTime = nowZoned.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });

      if (targetTime <= nowZoned) {
        targetTime = targetTime.plus({ days: 1 });
      }

      return targetTime.toISO();
    }

    const plainHourMatch = normalized.match(/^(\d{1,2})$/);
    if (plainHourMatch) {
      console.log(`[LLM Parser] Text matched plain hour pattern: ${timePattern}`);
      const hours = parseInt(plainHourMatch[1]);
      
      if (hours < 0 || hours > 23) {
        console.log(`[LLM Parser] Invalid hour value: ${hours}`);
        return null;
      }

      let targetTime = nowZoned.set({ hour: hours, minute: 0, second: 0, millisecond: 0 });

      if (targetTime <= nowZoned) {
        targetTime = targetTime.plus({ days: 1 });
      }

      return targetTime.toISO();
    }

    const weeksMatch = normalized.match(
      /^za (\d+) tygodnie (poniedziałek|wtorek|środa|czwartek|piątek|sobota|niedziela) (\d{1,2})(?::(\d{2}))?$/
    );
    if (weeksMatch) {
      console.log(`[LLM Parser] Text matched weeks day pattern: ${timePattern}`);
      const weeks = parseInt(weeksMatch[1]);
      const dayName = weeksMatch[2];
      const hours = parseInt(weeksMatch[3]);
      const minutes = weeksMatch[4] ? parseInt(weeksMatch[4]) : 0;
      
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.log(`[LLM Parser] Invalid time values: ${hours}:${minutes}`);
        return null;
      }

      const dayIndex = dayNames.indexOf(dayName);

      if (dayIndex !== -1) {
        const nextDay = this.getNextDayOfWeekLuxon(dayIndex, hours, minutes, userTimeZone);
        const targetTime = nextDay.plus({ weeks });
        return targetTime.toISO();
      }
    }

    const weekMatch = normalized.match(/^za tydzień (\d{1,2})(?::(\d{2}))?$/);
    if (weekMatch) {
      console.log(`[LLM Parser] Text matched week pattern: ${timePattern}`);
      const hours = parseInt(weekMatch[1]);
      const minutes = weekMatch[2] ? parseInt(weekMatch[2]) : 0;
      
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.log(`[LLM Parser] Invalid time values: ${hours}:${minutes}`);
        return null;
      }

      const targetTime = now
        .plus({ weeks: 1 })
        .setZone(userTimeZone)
        .set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
      return targetTime.toISO();
    }

    const weekDayMatch = normalized.match(
      /^za tydzień (poniedziałek|wtorek|środa|czwartek|piątek|sobota|niedziela) (\d{1,2})(?::(\d{2}))?$/
    );
    if (weekDayMatch) {
      console.log(`[LLM Parser] Text matched week day pattern: ${timePattern}`);
      const dayName = weekDayMatch[1];
      const hours = parseInt(weekDayMatch[2]);
      const minutes = weekDayMatch[3] ? parseInt(weekDayMatch[3]) : 0;
      
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.log(`[LLM Parser] Invalid time values: ${hours}:${minutes}`);
        return null;
      }

      const dayIndex = dayNames.indexOf(dayName);

      if (dayIndex !== -1) {
        const targetTime = this.getNextDayOfWeekLuxon(dayIndex, hours, minutes, userTimeZone);
        return targetTime.toISO();
      }
    }

    const dayMatch = normalized.match(
      /^(poniedziałek|wtorek|środa|czwartek|piątek|sobota|niedziela) (\d{1,2})(?::(\d{2}))?$/
    );
    if (dayMatch) {
      console.log(`[LLM Parser] Text matched day of week pattern: ${timePattern}`);
      const dayName = dayMatch[1];
      const hours = parseInt(dayMatch[2]);
      const minutes = dayMatch[3] ? parseInt(dayMatch[3]) : 0;
      
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.log(`[LLM Parser] Invalid time values: ${hours}:${minutes}`);
        return null;
      }

      const dayIndex = dayNames.indexOf(dayName);

      if (dayIndex !== -1) {
        const targetTime = this.getNextDayOfWeekLuxon(dayIndex, hours, minutes, userTimeZone);
        return targetTime.toISO();
      }
    }

    return null;
  }

  private getNextDayOfWeekLuxon(
    targetDayIndex: number,
    hours: number,
    minutes: number,
    timeZone: string
  ): DateTime {
    const now = DateTime.now().setZone(timeZone);
    const currentDayIndex = now.weekday === 7 ? 6 : now.weekday - 1;

    let daysToAdd = targetDayIndex - currentDayIndex;
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }

    return now
      .plus({ days: daysToAdd })
      .set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
  }
}

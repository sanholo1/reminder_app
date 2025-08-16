import OpenAI from 'openai';
import { DateTime } from 'luxon';
import { 
  InvalidGPTConversationError, 
  NoTimeError, 
  NoActivityError, 
  PastTimeError, 
  NoActivityAndTimeError,
  InvalidTimeFormatError,
  DuplicateDataError,
  AbuseError
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
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.userSessionService = new UserSessionService();
  }

  async parseReminderText(text: string, sessionId?: string): Promise<LLMParseResult | LLMErrorResult | LLMAbuseResult> {
    try {
      // First check if this is an abuse attempt
      const abuseCheck = await this.checkForAbuse(text, sessionId);
      if (abuseCheck) {
        return abuseCheck;
      }

      const prompt = this.buildPrompt(text);
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: 'Jesteś ekspertem w parsowaniu tekstu. Twoim zadaniem jest wyciągnięcie z tekstu informacji o aktywności i wzorcu czasowym. Odpowiadaj TYLKO w formacie JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 200
      });
      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Brak odpowiedzi od LLM');
      const patternResult = this.parseLLMResponse(content);
      if ('error' in patternResult) return patternResult;
      
      const datetime = this.convertTimePatternToDateTime(patternResult.timePattern);
      if (!datetime) {
        return { error: 'Nie można ustawić przypomnienia w przeszłości' };
      }
      
      return { activity: patternResult.activity, datetime };
    } catch (error) {
      if (error instanceof InvalidGPTConversationError ||
          error instanceof NoTimeError ||
          error instanceof NoActivityError ||
          error instanceof PastTimeError ||
          error instanceof NoActivityAndTimeError ||
          error instanceof InvalidTimeFormatError ||
          error instanceof DuplicateDataError ||
          error instanceof AbuseError) {
        throw error;
      }
      throw new Error('Nie udało się sparsować tekstu przez AI');
    }
  }

  private async checkForAbuse(text: string, sessionId?: string): Promise<LLMAbuseResult | null> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Jesteś ekspertem w wykrywaniu nadużyć w aplikacji przypomnień. Twoim zadaniem jest sprawdzenie, czy użytkownik używa aplikacji zgodnie z jej przeznaczeniem.

Aplikacja służy TYLKO do ustawiania przypomnień. Użytkownik powinien podawać:
- Aktywność do wykonania
- Czas wykonania (za X godzin/minut, jutro o X, w poniedziałek o X, etc.)

WAŻNE: Jeśli użytkownik próbuje ustawić przypomnienie w przeszłości (np. "wczoraj", "ubiegły poniedziałek"), to NIE jest to nadużycie - to jest błąd, który zostanie obsłużony przez główny parser.

Nadużycie to tylko pytania/żądania niezwiązane z ustawianiem przypomnień.

Odpowiedz TYLKO w formacie JSON:
{"isAbuse": true/false}

Przykłady nadużyć:
- "Jak się masz?" - pytania osobiste
- "Opowiedz mi żart" - prośby o rozrywkę
- "Pomóż mi z matematyką" - prośby o pomoc
- "Co myślisz o polityce?" - pytania o opinie
- "Przetłumacz to" - prośby o tłumaczenie
- "Napisz mi wiersz" - prośby o kreatywność
- "Oblicz 2+2" - prośby o obliczenia
- "Jak napisać kod?" - prośby o pomoc programistyczną

Przykłady prawidłowego użycia (NIE nadużycia):
- "Przypomnij mi za godzinę" - OK
- "Zadzwoń do mamy jutro o 15:00" - OK
- "Kup chleb za 30 minut" - OK
- "Spotkanie w poniedziałek o 9:00" - OK
- "wczoraj o 15:00 spotkanie" - OK (błąd przeszłości, ale nie nadużycie)
- "ubiegły poniedziałek o 10:00" - OK (błąd przeszłości, ale nie nadużycie)`
          },
          {
            role: 'user',
            content: `Sprawdź czy to nadużycie: "${text}"`
          }
        ],
        temperature: 0.1,
        max_tokens: 100
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return null;

      const cleanResponse = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);

      if (parsed.isAbuse && sessionId) {
        // Record the abuse attempt
        const attemptResult = await this.userSessionService.recordAttempt(sessionId, true);
        
        if (attemptResult.isBlocked) {
          return {
            error: 'Twoje konto zostało zablokowane na 24 godziny z powodu nieprawidłowego użycia.',
            remainingAttempts: 0,
            isBlocked: true
          };
        } else {
          return {
            error: `To pytanie nie dotyczy tworzenia przypomnień. Używaj aplikacji tylko do ustawiania przypomnień. Pozostało ${attemptResult.remainingAttempts} prób przed zablokowaniem.`,
            remainingAttempts: attemptResult.remainingAttempts,
            isBlocked: false
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

    return `Przeanalizuj poniższy tekst i wyciągnij informacje o aktywności oraz wzorcu czasowym.

WAŻNE ZASADY:
1. Zwróć DOKŁADNIE wzorzec czasowy z listy poniżej, nie naturalny język
2. Jeśli użytkownik nie poda godziny, zwróć błąd: {"error": "NO_TIME"}
3. Jeśli użytkownik nie poda aktywności, zwróć błąd: {"error": "NO_ACTIVITY"}
4. Jeśli użytkownik poda tylko godzinę bez dnia (np. "spotkanie o 15"), sprawdź czy godzina już minęła - jeśli tak, ustaw na tą godzinę, ale na jutro
5. Jeśli użytkownik nie poda ani aktywności ani czasu, zwróć błąd: {"error": "NO_ACTIVITY_AND_TIME"}
6. Jeśli w zdaniu jest coś, co wskazuje na przeszłość (np. "wczoraj", "ubiegły poniedziałek", "pół godziny temu"), zwróć błąd: {"error": "PAST_TIME"}
7. Jeśli użytkownik poda nieprawidłowy format godziny, zwróć błąd: {"error": "INVALID_TIME_FORMAT"}
8. Jeśli użytkownik poda kilka różnych aktywności lub czasów lub dni, zwróć błąd: {"error": "DUPLICATE_DATA"}

FORMAT ODPOWIEDZI:
- Zwróć tylko czysty JSON bez dodatkowego tekstu i bez backticków
- Używaj małych liter i polskich znaków zgodnie z listą wzorców poniżej



WALIDACJA FORMATU GODZINY:
- Prawidłowe formaty: "14", "14:00", "15:30", "09:15", "23:45"
- Nieprawidłowe formaty: "134", "25:00", "14:60", "99", "14:99", "25:30", "14:70"
- Godzina musi być w zakresie 0-23
- Minuty muszą być w zakresie 0-59
- Jeśli podano tylko godzinę bez minut (np. "14"), automatycznie dodaj ":00"

Tekst: "${text}"

Odpowiedz w formacie JSON:
{"activity": "nazwa aktywności", "timePattern": "wzorzec czasowy"}

 DOKŁADNE WZORCE CZASOWE (używaj tylko tych):
- "+HH:MM" - za określoną liczbę godzin i minut (np. "+00:30", "+02:15", "+05:05")
- "-HH:MM" - dla czasu w przeszłości (np. "-03:30")
- "jutro HH:MM" - jutro o konkretnej godzinie (np. "jutro 15:00", "jutro 09:00")
- "po jutrze HH:MM" - pojutrze o konkretnej godzinie (np. "po jutrze 15:00", "po jutrze 09:00")
- "pojutrze HH:MM" - pojutrze o konkretnej godzinie (np. "pojutrze 15:00", "pojutrze 09:00")
- "dziś HH:MM" - dziś o konkretnej godzinie (np. "dziś 15:00", "dziś 08:00")
- "poniedziałek HH:MM" - najbliższy poniedziałek o HH:MM
- "wtorek HH:MM" - najbliższy wtorek o HH:MM
- "środa HH:MM" - najbliższa środa o HH:MM
- "czwartek HH:MM" - najbliższy czwartek o HH:MM
- "piątek HH:MM" - najbliższy piątek o HH:MM
- "sobota HH:MM" - najbliższa sobota o HH:MM
- "niedziela HH:MM" - najbliższa niedziela o HH:MM
- "za tydzień HH:MM" - za tydzień o HH:MM
 - "za tydzień dzień HH:MM" - za tydzień w konkretny dzień o HH:MM (np. "za tydzień poniedziałek 12:00")
 - "za X tygodnie dzień HH:MM" - za X tygodni w konkretny dzień o HH:MM (np. "za 2 tygodnie poniedziałek 12:00")

PRZYKŁADY KONWERSJI:
- "za dwie godziny" → "+02:00"
- "za godzinę" → "+01:00"
- "za trzy godziny" → "+03:00"
- "za 15 minut" → "+00:15"
- "za godzinę i 30 minut" → "+01:30"
- "za dwie godziny i piętnaście minut" → "+02:15"
- "za 5 godzin i 5 minut" → "+05:05"
- "za 30 minut" → "+00:30"
- "jutro o 9 rano" → "jutro 09:00"
- "jutro o 15:00" → "jutro 15:00"
- "po jutrze o 9 rano" → "po jutrze 09:00"
- "po jutrze o 15:00" → "po jutrze 15:00"
- "pojutrze o 9 rano" → "pojutrze 09:00"
- "pojutrze o 15:00" → "pojutrze 15:00"
- "dziś o 8" → "dziś 08:00"
- "w poniedziałek o 8:00" → "poniedziałek 08:00"



- "w sobote za dwa tygodnie o 12" → "za 2 tygodnie sobota 12:00"
- "za tydzień w poniedziałek o 9" → "za tydzień poniedziałek 09:00"
- "za 3 tygodnie w piątek o 18" → "za 3 tygodnie piątek 18:00"
- "za tydzień w środę o 10" → "za tydzień środa 10:00"
- "za 4 tygodnie w niedzielę o 15" → "za 4 tygodnie niedziela 15:00"
- "za 2 tygodnie w poniedziałek o 8" → "za 2 tygodnie poniedziałek 08:00"
- "za 5 tygodni w czwartek o 14" → "za 5 tygodnie czwartek 14:00"



Przykłady (zakładając, że teraz jest ${today} godzina ${pad(hour)}:${pad(minute)}):
- "za godzinę i 30 minut wyłączyć pralkę" → {"activity": "wyłączyć pralkę", "timePattern": "+01:30"}
- "za 15 minut zadzwonić do mamy" → {"activity": "zadzwonić do mamy", "timePattern": "+00:15"}
- "za dwie godziny wyprowadź psa" → {"activity": "wyprowadź psa", "timePattern": "+02:00"}
- "podlej kwiaty za dwie godziny" → {"activity": "podlej kwiaty", "timePattern": "+02:00"}
- "wyjdz z psem za 2 godziny" → {"activity": "wyjdz z psem", "timePattern": "+02:00"}
- "za 5 godzin i 5 minut kupić chleb" → {"activity": "kupić chleb", "timePattern": "+05:05"}
- "za 30 minut sprawdź piekarnik" → {"activity": "sprawdź piekarnik", "timePattern": "+00:30"}
- "jutro o 9 rano kupić chleb" → {"activity": "kupić chleb", "timePattern": "jutro 09:00"}
- "spotkanie o 15:00" → {"activity": "spotkanie", "timePattern": "dziś 15:00"} (jeśli przed 15:00) lub {"activity": "spotkanie", "timePattern": "jutro 15:00"} (jeśli po 15:00)
- "w poniedziałek o 8:00 spotkanie" → {"activity": "spotkanie", "timePattern": "poniedziałek 08:00"}
- "narysuj obraz w niedzielę za tydzień w południe" → {"activity": "narysuj obraz", "timePattern": "za tydzień niedziela 12:00"}
- "narysuj obraz w najbliższą niedzielę w południe" → {"activity": "narysuj obraz", "timePattern": "niedziela 12:00"}
- "odkurz mieszkanie dziś o 8" (jeśli jest już po 8) → {"activity": "odkurz mieszkanie", "timePattern": "jutro 08:00"}
- "zadzwoń do taty za 15 minut" → {"activity": "zadzwoń do taty", "timePattern": "+00:15"}
- "za trzy godziny wyprowadź psa" → {"activity": "wyprowadź psa", "timePattern": "+03:00"}
- "za pięć minut sprawdź piekarnik" → {"activity": "sprawdź piekarnik", "timePattern": "+00:05"}
- "za 10 minut podlać kwiaty" → {"activity": "podlać kwiaty", "timePattern": "+00:10"}
- "za dwie godziny i piętnaście minut zadzwonić do mamy" → {"activity": "zadzwonić do mamy", "timePattern": "+02:15"}
- "za 2 godziny i 30 minut kupić chleb" → {"activity": "kupić chleb", "timePattern": "+02:30"}
- "po jutrze o 9 rano kupić chleb" → {"activity": "kupić chleb", "timePattern": "po jutrze 09:00"}
- "pojutrze o 15:00 spotkanie" → {"activity": "spotkanie", "timePattern": "pojutrze 15:00"}
- "po jutrze o 8 rano pobudka" → {"activity": "pobudka", "timePattern": "po jutrze 08:00"}
- "pojutrze o 12:30 obiad" → {"activity": "obiad", "timePattern": "pojutrze 12:30"}
 - "w przyszły piątek o 17:00 kino" → {"activity": "kino", "timePattern": "za tydzień piątek 17:00"}
- "w sobote za dwa tygodnie o 12 wyprowadz psa" → {"activity": "wyprowadz psa", "timePattern": "za 2 tygodnie sobota 12:00"}
- "za tydzień w poniedziałek o 9 spotkanie" → {"activity": "spotkanie", "timePattern": "za tydzień poniedziałek 09:00"}
- "za 3 tygodnie w piątek o 18 kino" → {"activity": "kino", "timePattern": "za 3 tygodnie piątek 18:00"}
- "za 4 tygodnie w niedzielę o 15 obiad" → {"activity": "obiad", "timePattern": "za 4 tygodnie niedziela 15:00"}
- "przypomnij mi" → {"error": "NO_ACTIVITY_AND_TIME"}
- "zrób zakupy wczoraj o 12" → {"error": "PAST_TIME"}
- "dodaj przypomnienie jutro" → {"error": "NO_TIME"}
- "za godzinę" → {"error": "NO_ACTIVITY"}
- "jutro o 15:00" → {"error": "NO_ACTIVITY"}
- "spotkanie o 134" → {"error": "INVALID_TIME_FORMAT"}
- "zadzwoń o 25:00" → {"error": "INVALID_TIME_FORMAT"}
- "kup chleb o 14:60" → {"error": "INVALID_TIME_FORMAT"}
- "wyprowadź psa o 99" → {"error": "INVALID_TIME_FORMAT"}
- "obiad o 14:99" → {"error": "INVALID_TIME_FORMAT"}
- "spotkanie o 25:30" → {"error": "INVALID_TIME_FORMAT"}
- "kino o 14:70" → {"error": "INVALID_TIME_FORMAT"}
- "spotkanie i kino za godzinę" → {"error": "DUPLICATE_DATA"}
- "zadzwoń do mamy i taty za 2 godziny" → {"error": "DUPLICATE_DATA"}
- "kup chleb za godzinę i za 2 godziny" → {"error": "DUPLICATE_DATA"}
- "spotkanie jutro i w poniedziałek" → {"error": "DUPLICATE_DATA"}
- "zadzwoń do mamy za godzinę i kup chleb za 2 godziny" → {"error": "DUPLICATE_DATA"}
- "spotkanie o 15:00 i kino o 18:00" → {"error": "DUPLICATE_DATA"}
- "zadzwoń do mamy i taty jutro o 10:00" → {"activity": "zadzwoń do mamy i taty", "timePattern": "jutro 10:00"}
- "spotkanie i kino jutro o 15:00" → {"activity": "spotkanie i kino", "timePattern": "jutro 15:00"}

SPECJALNE PRZYPADKI DLA GODZINY BEZ DNIA:
- Jeśli teraz jest przed 15:00, "spotkanie o 15:00" → {"activity": "spotkanie", "timePattern": "dziś 15:00"}
- Jeśli teraz jest po 15:00, "spotkanie o 15:00" → {"activity": "spotkanie", "timePattern": "jutro 15:00"}

PAMIĘTAJ: Używaj tylko dokładnych wzorców z listy powyżej!

Odpowiedz tylko w formacie JSON.`;
  }

  private parseLLMResponse(response: string): LLMTimePattern | LLMErrorResult {
    try {
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);
      
      if (parsed.error) {
        // Convert error codes to custom exceptions
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
      // Re-throw custom exceptions
      if (error instanceof NoTimeError || 
          error instanceof NoActivityError || 
          error instanceof PastTimeError || 
          error instanceof NoActivityAndTimeError ||
          error instanceof InvalidTimeFormatError ||
          error instanceof DuplicateDataError) {
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
    const dayNames = ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela'];
    
    // Handle new format: +HH:MM or -HH:MM
    const newFormatMatch = normalized.match(/^([+-])(\d{2}):(\d{2})$/);
    
    if (newFormatMatch) {
      console.log(`[LLM Parser] Text matched new format pattern: ${timePattern}`);
      const sign = newFormatMatch[1];
      const hours = parseInt(newFormatMatch[2]);
      const minutes = parseInt(newFormatMatch[3]);
      
      if (sign === '-') {
        // Past time - return null to indicate error
        console.log(`[LLM Parser] Past time detected: ${timePattern}`);
        return null;
      } else if (sign === '+') {
        // Future time - add the specified hours and minutes
        const targetTime = nowZoned.plus({ hours, minutes });
        return targetTime.toISO();
      }
    }
    
    // jutro HH[:MM] (minutes optional -> default 00)
    const tomorrowMatch = normalized.match(/^jutro (\d{1,2})(?::(\d{2}))?$/);
    if (tomorrowMatch) {
      console.log(`[LLM Parser] Text matched tomorrow pattern: ${timePattern}`);
      const hours = parseInt(tomorrowMatch[1]);
      const minutes = tomorrowMatch[2] ? parseInt(tomorrowMatch[2]) : 0;
      const tomorrow = nowZoned.plus({ days: 1 });
      const targetTime = tomorrow.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
      return targetTime.toISO();
    }
    
    // po jutrze HH[:MM] (minutes optional -> default 00)
    const dayAfterTomorrowMatch = normalized.match(/^po jutrze (\d{1,2})(?::(\d{2}))?$/);
    if (dayAfterTomorrowMatch) {
      console.log(`[LLM Parser] Text matched day after tomorrow pattern: ${timePattern}`);
      const hours = parseInt(dayAfterTomorrowMatch[1]);
      const minutes = dayAfterTomorrowMatch[2] ? parseInt(dayAfterTomorrowMatch[2]) : 0;
      const dayAfterTomorrow = nowZoned.plus({ days: 2 });
      const targetTime = dayAfterTomorrow.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
      return targetTime.toISO();
    }
    
    // pojutrze HH[:MM] (minutes optional -> default 00)
    const pojutrzeMatch = normalized.match(/^pojutrze (\d{1,2})(?::(\d{2}))?$/);
    if (pojutrzeMatch) {
      console.log(`[LLM Parser] Text matched pojutrze pattern: ${timePattern}`);
      const hours = parseInt(pojutrzeMatch[1]);
      const minutes = pojutrzeMatch[2] ? parseInt(pojutrzeMatch[2]) : 0;
      const dayAfterTomorrow = nowZoned.plus({ days: 2 });
      const targetTime = dayAfterTomorrow.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
      return targetTime.toISO();
    }
    
    // Support "dziś", "dzis", and "dzisiaj" with optional minutes
    const todayMatch = normalized.match(/^dzi(?:ś|s(?:iaj)?) (\d{1,2})(?::(\d{2}))?$/);
    if (todayMatch) {
      console.log(`[LLM Parser] Text matched today pattern: ${timePattern}`);
      const hours = parseInt(todayMatch[1]);
      const minutes = todayMatch[2] ? parseInt(todayMatch[2]) : 0;
      let targetTime = nowZoned.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
      
      if (targetTime <= nowZoned) {
        targetTime = targetTime.plus({ days: 1 });
      }

      return targetTime.toISO();
    }

    // Handle plain "HH:MM" without explicit day by assuming today if in the future,
    // otherwise schedule for tomorrow at the same time
    const plainTimeMatch = normalized.match(/^(\d{1,2}):(\d{2})$/);
    if (plainTimeMatch) {
      console.log(`[LLM Parser] Text matched plain time pattern: ${timePattern}`);
      const hours = parseInt(plainTimeMatch[1]);
      const minutes = parseInt(plainTimeMatch[2]);
      let targetTime = nowZoned.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });

      if (targetTime <= nowZoned) {
        targetTime = targetTime.plus({ days: 1 });
      }

      return targetTime.toISO();
    }

    // Handle plain "HH" without minutes by treating it as "HH:00"
    const plainHourMatch = normalized.match(/^(\d{1,2})$/);
    if (plainHourMatch) {
      console.log(`[LLM Parser] Text matched plain hour pattern: ${timePattern}`);
      const hours = parseInt(plainHourMatch[1]);
      let targetTime = nowZoned.set({ hour: hours, minute: 0, second: 0, millisecond: 0 });

      if (targetTime <= nowZoned) {
        targetTime = targetTime.plus({ days: 1 });
      }

      return targetTime.toISO();
    }
    
    // Handle "za X tygodnie dzień HH:MM" pattern - MUST BE BEFORE day of week pattern
    const weeksMatch = normalized.match(/^za (\d+) tygodnie (poniedziałek|wtorek|środa|czwartek|piątek|sobota|niedziela) (\d{1,2})(?::(\d{2}))?$/);
    if (weeksMatch) {
      console.log(`[LLM Parser] Text matched weeks day pattern: ${timePattern}`);
      const weeks = parseInt(weeksMatch[1]);
      const dayName = weeksMatch[2];
      const hours = parseInt(weeksMatch[3]);
      const minutes = weeksMatch[4] ? parseInt(weeksMatch[4]) : 0;
      const dayIndex = dayNames.indexOf(dayName);
      
      if (dayIndex !== -1) {
        // First get the next occurrence of the day
        const nextDay = this.getNextDayOfWeekLuxon(dayIndex, hours, minutes, userTimeZone);
        // Then add the specified number of weeks
        const targetTime = nextDay.plus({ weeks });
        return targetTime.toISO();
      }
    }
    
    const weekMatch = normalized.match(/^za tydzień (\d{1,2})(?::(\d{2}))?$/);
    if (weekMatch) {
      console.log(`[LLM Parser] Text matched week pattern: ${timePattern}`);
      const hours = parseInt(weekMatch[1]);
      const minutes = weekMatch[2] ? parseInt(weekMatch[2]) : 0;
      const targetTime = now.plus({ weeks: 1 }).setZone(userTimeZone).set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
      return targetTime.toISO();
    }
    
    const weekDayMatch = normalized.match(/^za tydzień (poniedziałek|wtorek|środa|czwartek|piątek|sobota|niedziela) (\d{1,2})(?::(\d{2}))?$/);
    if (weekDayMatch) {
      console.log(`[LLM Parser] Text matched week day pattern: ${timePattern}`);
      const dayName = weekDayMatch[1];
      const hours = parseInt(weekDayMatch[2]);
      const minutes = weekDayMatch[3] ? parseInt(weekDayMatch[3]) : 0;
      const dayIndex = dayNames.indexOf(dayName);
      
      if (dayIndex !== -1) {
        const targetTime = this.getNextDayOfWeekLuxon(dayIndex, hours, minutes, userTimeZone);
        return targetTime.toISO();
      }
    }
    
    const dayMatch = normalized.match(/^(poniedziałek|wtorek|środa|czwartek|piątek|sobota|niedziela) (\d{1,2})(?::(\d{2}))?$/);
    if (dayMatch) {
      console.log(`[LLM Parser] Text matched day of week pattern: ${timePattern}`);
      const dayName = dayMatch[1];
      const hours = parseInt(dayMatch[2]);
      const minutes = dayMatch[3] ? parseInt(dayMatch[3]) : 0;
      const dayIndex = dayNames.indexOf(dayName);
      
      if (dayIndex !== -1) {
        const targetTime = this.getNextDayOfWeekLuxon(dayIndex, hours, minutes, userTimeZone);
        return targetTime.toISO();
      }
    }
    
    return null;
  }
  
  private getNextDayOfWeekLuxon(targetDayIndex: number, hours: number, minutes: number, timeZone: string): DateTime {
    const now = DateTime.now().setZone(timeZone);
    const currentDayIndex = now.weekday === 7 ? 6 : now.weekday - 1; // Convert Sunday=7 to Sunday=6
    
    let daysToAdd = targetDayIndex - currentDayIndex;
    if (daysToAdd <= 0) daysToAdd += 7;
    
    return now.plus({ days: daysToAdd }).set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
  }
}
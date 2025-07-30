import OpenAI from 'openai';

export interface LLMParseResult {
  activity: string;
  datetime: string;
}

export interface LLMErrorResult {
  error: string;
}

export interface LLMTimePattern {
  activity: string;
  timePattern: string;
}

export class LLMParserService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async parseReminderText(text: string): Promise<LLMParseResult | LLMErrorResult> {
    try {
      const prompt = this.buildPrompt(text);
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: 'Jesteś ekspertem w parsowaniu tekstu w języku polskim. Twoim zadaniem jest wyciągnięcie z tekstu informacji o aktywności i wzorcu czasowym. Odpowiadaj TYLKO w formacie JSON.' },
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
      throw new Error('Nie udało się sparsować tekstu przez AI');
    }
  }

  private buildPrompt(text: string): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const hour = now.getHours();
    const minute = now.getMinutes();

    return `Przeanalizuj poniższy tekst i wyciągnij informacje o aktywności oraz wzorcu czasowym.
Użytkownik podaje czas w strefie czasowej Europe/Warsaw.

WAŻNE ZASADY:
1. Zwróć DOKŁADNIE wzorzec czasowy z listy poniżej, nie naturalny język
2. Jeśli użytkownik nie poda godziny, zwróć błąd: {"error": "Nie podano godziny przypomnienia"}
3. Jeśli użytkownik nie poda aktywności, zwróć błąd: {"error": "Nie podano aktywności"}
4. Jeśli w zdaniu jest coś, co wskazuje na przeszłość (np. "wczoraj", "ubiegły poniedziałek"), zwróć błąd: {"error": "Nie można ustawić przypomnienia w przeszłości"}
5. Jeśli użytkownik poda tylko godzinę bez dnia (np. "o 15:00"), sprawdź czy godzina już minęła - jeśli tak, ustaw na jutro

Tekst: "${text}"

Odpowiedz w formacie JSON:
{"activity": "nazwa aktywności", "timePattern": "wzorzec czasowy"}

DOKŁADNE WZORCE CZASOWE (używaj tylko tych):
- "za Xh" - za X godzin (np. "za 2h", "za 1h", "za 3h")
- "za Xm" - za X minut (np. "za 15m", "za 30m", "za 45m")
- "za Xh Ym" - za X godzin i Y minut (np. "za 1h 30m", "za 2h 15m")
- "jutro HH:MM" - jutro o konkretnej godzinie (np. "jutro 15:00", "jutro 09:00")
- "dziś HH:MM" - dziś o konkretnej godzinie (np. "dziś 15:00", "dziś 08:00")
- "poniedziałek HH:MM" - najbliższy poniedziałek o HH:MM
- "wtorek HH:MM" - najbliższy wtorek o HH:MM
- "środa HH:MM" - najbliższa środa o HH:MM
- "czwartek HH:MM" - najbliższy czwartek o HH:MM
- "piątek HH:MM" - najbliższy piątek o HH:MM
- "sobota HH:MM" - najbliższa sobota o HH:MM
- "niedziela HH:MM" - najbliższa niedziela o HH:MM
- "za tydzień HH:MM" - za tydzień o HH:MM
- "za tydzień dzień HH:MM" - za tydzień w konkretny dzień o HH:MM

PRZYKŁADY KONWERSJI:
- "za dwie godziny" → "za 2h"
- "za godzinę" → "za 1h"
- "za trzy godziny" → "za 3h"
- "za 15 minut" → "za 15m"
- "za godzinę i 30 minut" → "za 1h 30m"
- "za dwie godziny i piętnaście minut" → "za 2h 15m"
- "jutro o 9 rano" → "jutro 09:00"
- "jutro o 15:00" → "jutro 15:00"
- "dziś o 8" → "dziś 08:00"
- "w poniedziałek o 8:00" → "poniedziałek 08:00"

Przykłady (zakładając, że teraz jest ${today} godzina ${pad(hour)}:${pad(minute)}):
- "za godzinę i 30 minut wyłączyć pralkę" → {"activity": "wyłączyć pralkę", "timePattern": "za 1h 30m"}
- "za 15 minut zadzwonić do mamy" → {"activity": "zadzwonić do mamy", "timePattern": "za 15m"}
- "za dwie godziny wyprowadź psa" → {"activity": "wyprowadź psa", "timePattern": "za 2h"}
- "podlej kwiaty za dwie godziny" → {"activity": "podlej kwiaty", "timePattern": "za 2h"}
- "wyjdz z psem za 2 godziny" → {"activity": "wyjdz z psem", "timePattern": "za 2h"}
- "jutro o 9 rano kupić chleb" → {"activity": "kupić chleb", "timePattern": "jutro 09:00"}
- "spotkanie o 15:00" → {"activity": "spotkanie", "timePattern": "dziś 15:00"} (jeśli przed 15:00) lub {"activity": "spotkanie", "timePattern": "jutro 15:00"} (jeśli po 15:00)
- "w poniedziałek o 8:00 spotkanie" → {"activity": "spotkanie", "timePattern": "poniedziałek 08:00"}
- "narysuj obraz w niedzielę za tydzień w południe" → {"activity": "narysuj obraz", "timePattern": "za tydzień niedziela 12:00"}
- "narysuj obraz w najbliższą niedzielę w południe" → {"activity": "narysuj obraz", "timePattern": "niedziela 12:00"}
- "odkurz mieszkanie dziś o 8" (jeśli jest już po 8) → {"activity": "odkurz mieszkanie", "timePattern": "jutro 08:00"}
- "zadzwoń do taty za 15 minut" → {"activity": "zadzwoń do taty", "timePattern": "za 15m"}
- "za trzy godziny wyprowadź psa" → {"activity": "wyprowadź psa", "timePattern": "za 3h"}
- "za pięć minut sprawdź piekarnik" → {"activity": "sprawdź piekarnik", "timePattern": "za 5m"}
- "za 10 minut podlać kwiaty" → {"activity": "podlać kwiaty", "timePattern": "za 10m"}
- "za dwie godziny i piętnaście minut zadzwonić do mamy" → {"activity": "zadzwonić do mamy", "timePattern": "za 2h 15m"}
- "za 2 godziny i 30 minut kupić chleb" → {"activity": "kupić chleb", "timePattern": "za 2h 30m"}
- "w przyszły piątek o 17:00 kino" → {"activity": "kino", "timePattern": "piątek 17:00"}
- "przypomnij mi" → {"error": "Nie podano aktywności ani czasu"}
- "zrób zakupy wczoraj o 12" → {"error": "Nie można ustawić przypomnienia w przeszłości"}
- "dodaj przypomnienie jutro" → {"error": "Nie podano godziny przypomnienia"}
- "za godzinę" → {"error": "Nie podano aktywności"}
- "jutro o 15:00" → {"error": "Nie podano aktywności"}

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
      if (parsed.error) return { error: parsed.error };
      if (!parsed.activity || !parsed.timePattern) return { error: 'Nie podano aktywności lub czasu' };
      return { activity: parsed.activity, timePattern: parsed.timePattern };
    } catch {
      return { error: 'Nieprawidłowa odpowiedź od AI' };
    }
  }

  private convertTimePatternToDateTime(timePattern: string): string | null {
    const now = new Date();
    
    const relativeTimeMatch = timePattern.match(/za (\d+)h(?: (\d+)m)?/);
    if (relativeTimeMatch) {
      const hours = parseInt(relativeTimeMatch[1]) + 2;
      const minutes = relativeTimeMatch[2] ? parseInt(relativeTimeMatch[2]) : 0;
      const targetTime = new Date(now.getTime() + (hours * 60 + minutes) * 60 * 1000);
      return targetTime.toISOString().slice(0, 19) + '.000';
    }
    
    const minutesMatch = timePattern.match(/za (\d+)m/);
    if (minutesMatch) {
      const minutes = parseInt(minutesMatch[1]) + 120;
      const targetTime = new Date(now.getTime() + minutes * 60 * 1000);
      return targetTime.toISOString().slice(0, 19) + '.000';
    }
    
    const hoursMatch = timePattern.match(/za (\d+)h/);
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1]) + 2;
      const targetTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
      return targetTime.toISOString().slice(0, 19) + '.000';
    }
    
    const tomorrowMatch = timePattern.match(/jutro (\d{1,2}):(\d{2})/);
    if (tomorrowMatch) {
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const hours = parseInt(tomorrowMatch[1]) + 2;
      const minutes = parseInt(tomorrowMatch[2]);
      tomorrow.setHours(hours, minutes, 0, 0);
      return tomorrow.toISOString().slice(0, 19) + '.000';
    }
    
    const todayMatch = timePattern.match(/dziś (\d{1,2}):(\d{2})/);
    if (todayMatch) {
      const hours = parseInt(todayMatch[1]) + 2;
      const minutes = parseInt(todayMatch[2]);
      const targetTime = new Date(now);
      targetTime.setHours(hours, minutes, 0, 0);
      
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const targetHour = hours;
      const targetMinute = minutes;
      
      if (targetHour < currentHour || (targetHour === currentHour && targetMinute <= currentMinute)) {
        return null;
      }
      
      return targetTime.toISOString().slice(0, 19) + '.000';
    }
    
    const dayNames = ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela'];
    const dayMatch = timePattern.match(/(poniedziałek|wtorek|środa|czwartek|piątek|sobota|niedziela) (\d{1,2}):(\d{2})/);
    if (dayMatch) {
      const dayName = dayMatch[1];
      const hours = parseInt(dayMatch[2]) + 2;
      const minutes = parseInt(dayMatch[3]);
      const dayIndex = dayNames.indexOf(dayName);
      
      if (dayIndex !== -1) {
        const targetTime = this.getNextDayOfWeek(dayIndex, hours, minutes);
        return targetTime.toISOString().slice(0, 19) + '.000';
      }
    }
    
    const weekMatch = timePattern.match(/za tydzień (\d{1,2}):(\d{2})/);
    if (weekMatch) {
      const hours = parseInt(weekMatch[1]) + 2;
      const minutes = parseInt(weekMatch[2]);
      const targetTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      targetTime.setHours(hours, minutes, 0, 0);
      return targetTime.toISOString().slice(0, 19) + '.000';
    }
    
    const weekDayMatch = timePattern.match(/za tydzień (poniedziałek|wtorek|środa|czwartek|piątek|sobota|niedziela) (\d{1,2}):(\d{2})/);
    if (weekDayMatch) {
      const dayName = weekDayMatch[1];
      const hours = parseInt(weekDayMatch[2]) + 2;
      const minutes = parseInt(weekDayMatch[3]);
      const dayIndex = dayNames.indexOf(dayName);
      
      if (dayIndex !== -1) {
        const targetTime = this.getNextDayOfWeek(dayIndex, hours, minutes);
        targetTime.setDate(targetTime.getDate() + 7);
        return targetTime.toISOString().slice(0, 19) + '.000';
      }
    }
    
    return null;
  }
  
  private getNextDayOfWeek(targetDayIndex: number, hours: number, minutes: number): Date {
    const now = new Date();
    const currentDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
    
    let daysToAdd = targetDayIndex - currentDayIndex;
    if (daysToAdd <= 0) daysToAdd += 7;
    
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysToAdd);
    targetDate.setHours(hours, minutes, 0, 0);
    
    return targetDate;
  }
}
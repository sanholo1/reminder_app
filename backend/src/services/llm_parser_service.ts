import OpenAI from 'openai';

export interface LLMParseResult {
  activity: string;
  datetime: string;
}

export interface LLMErrorResult {
  error: string;
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
          { role: 'system', content: 'Jesteś ekspertem w parsowaniu tekstu w języku polskim. Twoim zadaniem jest wyciągnięcie z tekstu informacji o aktywności i czasie. Odpowiadaj TYLKO w formacie JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 200
      });
      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Brak odpowiedzi od LLM');
      return this.parseLLMResponse(content);
    } catch (error) {
      throw new Error('Nie udało się sparsować tekstu przez AI');
    }
  }

  private buildPrompt(text: string): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrow = `${tomorrowDate.getFullYear()}-${pad(tomorrowDate.getMonth() + 1)}-${pad(tomorrowDate.getDate())}`;
    const hour = now.getHours();
    const minute = now.getMinutes();
    const plus2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const plus2hStr = `${plus2h.getFullYear()}-${pad(plus2h.getMonth() + 1)}-${pad(plus2h.getDate())}T${pad(plus2h.getHours())}:${pad(plus2h.getMinutes())}:00.000`;
    const plus1h = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    const plus1hStr = `${plus1h.getFullYear()}-${pad(plus1h.getMonth() + 1)}-${pad(plus1h.getDate())}T${pad(plus1h.getHours())}:${pad(plus1h.getMinutes())}:00.000`;

    return `Przeanalizuj poniższy tekst i wyciągnij informacje o aktywności oraz czasie.
Użytkownik podaje czas w strefie czasowej Europe/Warsaw (UTC+2 w lecie, UTC+1 w zimie). Zwróć datetime w tej strefie czasowej, a nie w UTC.

WAŻNE ZASADY:
1. Jeśli użytkownik nie poda dnia, ustaw przypomnienie na najbliższą możliwą godzinę (np. "za dwie godziny" = AKTUALNA DATA I GODZINA + 2 GODZINY, nawet jeśli przekracza północ).
2. Jeśli użytkownik poda tylko godzinę (np. "o 12"), ustaw na najbliższą taką godzinę (dzisiaj, jeśli jeszcze nie minęła, albo jutro, jeśli już minęła).
3. "za tydzień w niedzielę" oznacza kolejną niedzielę, nie dokładnie za 7 dni.
4. Jeśli w zdaniu jest coś, co jednoznacznie wskazuje na przeszłość (np. "wczoraj", "ubiegły poniedziałek", "przedwczoraj", data wcześniejsza niż dziś), zwróć błąd. Sama godzina w przeszłości (bez wskazania dnia) jest OK – wtedy ustaw na najbliższą taką godzinę.
5. Jeśli użytkownik nie poda godziny, zwróć błąd: {"error": "Nie podano godziny przypomnienia"}
6. Jeśli użytkownik nie poda aktywności, zwróć błąd: {"error": "Nie podano aktywności"}

Tekst: "${text}"

Odpowiedz w formacie JSON:
{"activity": "nazwa aktywności", "datetime": "2025-07-29T14:30:00.000"}

Przykłady (zakładając, że teraz jest ${today} godzina ${pad(hour)}:${pad(minute)}):
- "narysuj obraz w niedzielę za tydzień w południe" → {"activity": "narysuj obraz", "datetime": "[data niedzieli za 7-13 dni, nie najbliższej, tylko tej w kolejnym tygodniu]T12:00:00.000"}
- "narysuj obraz w najbliższą niedzielę w południe" → {"activity": "narysuj obraz", "datetime": "[data najbliższej niedzieli]T12:00:00.000"}
- "odkurz za 2 godziny" → {"activity": "odkurz", "datetime": "${plus2hStr}"}
- "za godzinę zadzwonić do mamy" → {"activity": "zadzwonić do mamy", "datetime": "${plus1hStr}"}
- "jutro o 9 rano kupić chleb" → {"activity": "kupić chleb", "datetime": "${tomorrow}T09:00:00.000"}
- "przypomnij mi" → {"error": "Nie podano aktywności ani czasu"}
- "zrób zakupy wczoraj o 12" → {"error": "Nie można ustawić przypomnienia w przeszłości"}
- "dodaj przypomnienie jutro" → {"error": "Nie podano godziny przypomnienia"}
- "za godzinę" → {"error": "Nie podano aktywności"}
- "jutro o 15:00" → {"error": "Nie podano aktywności"}
- "odkurz mieszkanie dziś o 8" (jeśli jest już po 8) → {"activity": "odkurz mieszkanie", "datetime": "${tomorrow}T08:00:00.000"}
- "zadzwoń do taty za 15 minut" → {"activity": "zadzwoń do taty", "datetime": "${new Date(now.getTime() + 15 * 60 * 1000).toISOString().slice(0,19)}.000"}
- "za trzy godziny wyprowadź psa" → {"activity": "wyprowadź psa", "datetime": "${new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0,19)}.000"}
- "za pięć minut sprawdź piekarnik" → {"activity": "sprawdź piekarnik", "datetime": "${new Date(now.getTime() + 5 * 60 * 1000).toISOString().slice(0,19)}.000"}
- "za 10 minut podlać kwiaty" → {"activity": "podlać kwiaty", "datetime": "${new Date(now.getTime() + 10 * 60 * 1000).toISOString().slice(0,19)}.000"}
- "za godzinę i 30 minut wyłączyć pralkę" → {"activity": "wyłączyć pralkę", "datetime": "${new Date(now.getTime() + 90 * 60 * 1000).toISOString().slice(0,19)}.000"}
- "za dwie godziny i piętnaście minut zadzwonić do mamy" → {"activity": "zadzwonić do mamy", "datetime": "${new Date(now.getTime() + (2 * 60 + 15) * 60 * 1000).toISOString().slice(0,19)}.000"}
- "za 2 godziny i 30 minut kupić chleb" → {"activity": "kupić chleb", "datetime": "${new Date(now.getTime() + (2 * 60 + 30) * 60 * 1000).toISOString().slice(0,19)}.000"}
- "w poniedziałek o 8:00 spotkanie" → {"activity": "spotkanie", "datetime": "[najbliższy poniedziałek]T08:00:00.000"}
- "w przyszły piątek o 17:00 kino" → {"activity": "kino", "datetime": "[data przyszłego piątku]T17:00:00.000"}

SPECJALNE PRZYPADKI DLA GODZINY BEZ DNIA:
- Jeśli teraz jest przed 15:00, "spotkanie o 15:00" → {"activity": "spotkanie", "datetime": "${today}T15:00:00.000"}
- Jeśli teraz jest po 15:00, "spotkanie o 15:00" → {"activity": "spotkanie", "datetime": "${tomorrow}T15:00:00.000"}

WAŻNE: Zawsze licz czas od aktualnej daty i godziny: ${now.toISOString()}.
"Za X godzin i Y minut" oznacza dodanie X godzin + Y minut do aktualnego czasu.

Odpowiedz tylko w formacie JSON.`;
  }

  private parseLLMResponse(response: string): LLMParseResult | LLMErrorResult {
    try {
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);
      if (parsed.error) return { error: parsed.error };
      if (!parsed.activity || !parsed.datetime) return { error: 'Nie podano aktywności lub czasu' };
      // Dodana walidacja godziny
      if (!/T\d{2}:\d{2}/.test(parsed.datetime)) {
        return { error: 'Nie podano godziny przypomnienia' };
      }
      const date = new Date(parsed.datetime);
      if (isNaN(date.getTime())) return { error: 'Nieprawidłowy format daty' };
      return { activity: parsed.activity, datetime: parsed.datetime };
    } catch {
      return { error: 'Nieprawidłowa odpowiedź od AI' };
    }
  }
}
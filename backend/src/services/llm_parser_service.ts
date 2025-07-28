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
        model: 'gpt-3.5-turbo',
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
    return `Przeanalizuj poniższy tekst i wyciągnij informacje o aktywności oraz czasie.
Tekst: "${text}"
Odpowiedz w formacie JSON:
{"activity": "nazwa aktywności", "datetime": "2024-01-15T14:30:00.000Z"}
Zasady:
1. activity - wyciągnij główną aktywność z tekstu (WYMAGANE)
2. datetime - utwórz datę w formacie ISO 8601 (WYMAGANE)
   - Dzisiejszą datę jeśli nie podano innej
   - Czas w formacie 24h
   - Jeśli data jest w przeszłości, ustaw na jutro
Jeśli nie możesz wyciągnąć aktywności lub czasu, zwróć błąd:
{"error": "Opis błędu"}
Przykłady:
- "spotkanie o 15:00" → {"activity": "spotkanie", "datetime": "2024-01-15T15:00:00.000Z"}
- "jutro o 9 rano kupić chleb" → {"activity": "kupić chleb", "datetime": "2024-01-16T09:00:00.000Z"}
- "za godzinę zadzwonić do mamy" → {"activity": "zadzwonić do mamy", "datetime": "2024-01-15T16:30:00.000Z"}
- "przypomnij mi" → {"error": "Nie podano aktywności ani czasu"}
Odpowiedz tylko w formacie JSON:`;
  }

  private parseLLMResponse(response: string): LLMParseResult | LLMErrorResult {
    try {
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);
      if (parsed.error) return { error: parsed.error };
      if (!parsed.activity || !parsed.datetime) return { error: 'Nie podano aktywności lub czasu' };
      const date = new Date(parsed.datetime);
      if (isNaN(date.getTime())) return { error: 'Nieprawidłowy format daty' };
      const now = new Date();
      if (date <= now) {
        date.setDate(date.getDate() + 1);
        parsed.datetime = date.toISOString();
      }
      return { activity: parsed.activity, datetime: parsed.datetime };
    } catch {
      return { error: 'Nieprawidłowa odpowiedź od AI' };
    }
  }
} 
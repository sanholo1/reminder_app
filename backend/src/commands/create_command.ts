import { ReminderRepositoryTypeORM, ReminderEntity } from '../repositories/reminder_repository_typeorm';
import { EmptyInputError, LLMParsingError, AbuseError } from '../exceptions/exception_handler';
import { LLMParserService, LLMErrorResult, LLMAbuseResult } from '../services/llm_parser_service';

export interface CreateReminderCommand {
  text: string;
  sessionId?: string;
  category?: string | null;
}

export interface CreateReminderResult {
  activity: string;
  datetime: string;
}

export interface CreateReminderAbuseResult {
  error: string;
  remainingAttempts: number;
  isBlocked: boolean;
}

export class CreateReminderHandler {
  private reminderRepository: ReminderRepositoryTypeORM;
  private llmParser: LLMParserService;

  constructor() {
    this.reminderRepository = new ReminderRepositoryTypeORM();
    this.llmParser = new LLMParserService();
  }

  async execute(command: CreateReminderCommand): Promise<CreateReminderResult | CreateReminderAbuseResult> {
    if (!command.text || !command.text.trim()) throw new EmptyInputError();
    
    const llmResult = await this.llmParser.parseReminderText(command.text, command.sessionId);
    
    if ('error' in llmResult) {
      // Check if it's an abuse result
      if ('remainingAttempts' in llmResult && 'isBlocked' in llmResult) {
        const abuseResult = llmResult as LLMAbuseResult;
        return {
          error: abuseResult.error,
          remainingAttempts: abuseResult.remainingAttempts,
          isBlocked: abuseResult.isBlocked
        };
      }
      // Regular error
      throw new LLMParsingError(llmResult.error);
    }
    
    const reminder: ReminderEntity = {
      id: this.generateId(),
      activity: llmResult.activity,
      datetime: new Date(llmResult.datetime),
      category: command.category || null,
      sessionId: command.sessionId || ''
    };
    await this.reminderRepository.create(reminder);
    return {
      activity: llmResult.activity,
      datetime: llmResult.datetime
    };
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
} 
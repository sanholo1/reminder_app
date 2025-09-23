import { ReminderWriteRepositoryTypeORM } from '../repositories/reminder_write_repository_typeorm';
import { ReminderEntity } from '../repositories/reminder_types';
import { EmptyInputError, LLMParsingError, AbuseError, ValidationError } from '../exceptions/exception_handler';
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
  private reminderRepository: ReminderWriteRepositoryTypeORM;
  private llmParser: LLMParserService;

  constructor() {
    this.reminderRepository = new ReminderWriteRepositoryTypeORM();
    this.llmParser = new LLMParserService();
  }

  async execute(command: CreateReminderCommand): Promise<CreateReminderResult | CreateReminderAbuseResult> {
    if (!command.text || !command.text.trim()) throw new EmptyInputError();
    const MAX_ACTIVITY_LENGTH = 200;
    
    const llmResult = await this.llmParser.parseReminderText(command.text, command.sessionId);
    
    if ('error' in llmResult) {
      
      if ('remainingAttempts' in llmResult && 'isBlocked' in llmResult) {
        const abuseResult = llmResult as LLMAbuseResult;
        return {
          error: abuseResult.error,
          remainingAttempts: abuseResult.remainingAttempts,
          isBlocked: abuseResult.isBlocked
        };
      }
    
      throw new LLMParsingError(llmResult.error);
    }
    
    if (llmResult.activity && llmResult.activity.length > MAX_ACTIVITY_LENGTH) {
      throw new ValidationError(`Aktywność przekracza maksymalną długość ${MAX_ACTIVITY_LENGTH} znaków`);
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
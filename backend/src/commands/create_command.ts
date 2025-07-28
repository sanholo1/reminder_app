import { ReminderRepositoryTypeORM, ReminderEntity } from '../repositories/reminder_repository_typeorm';
import { EmptyInputError, LLMParsingError } from '../exceptions/exception_handler';
import { LLMParserService, LLMErrorResult } from '../services/llm_parser_service';

export interface CreateReminderCommand {
  text: string;
}

export interface CreateReminderResult {
  activity: string;
  datetime: string;
}

export class CreateReminderHandler {
  private reminderRepository: ReminderRepositoryTypeORM;
  private llmParser: LLMParserService;

  constructor() {
    this.reminderRepository = new ReminderRepositoryTypeORM();
    this.llmParser = new LLMParserService();
  }

  async execute(command: CreateReminderCommand): Promise<CreateReminderResult> {
    if (!command.text || !command.text.trim()) throw new EmptyInputError();
    const llmResult = await this.llmParser.parseReminderText(command.text);
    if ('error' in llmResult) throw new LLMParsingError(llmResult.error);
    const reminder: ReminderEntity = {
      id: this.generateId(),
      activity: llmResult.activity,
      datetime: new Date(llmResult.datetime)
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
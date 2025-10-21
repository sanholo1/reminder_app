export class ValidationError extends Error {
  status: number;
  constructor(message: string = 'errors.validation') {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

export class EmptyInputError extends ValidationError {
  constructor(message: string = 'errors.emptyInput') {
    super(message);
    this.name = 'EmptyInputError';
  }
}

export class LLMParsingError extends ValidationError {
  constructor(message: string = 'errors.llmParsing') {
    super(message);
    this.name = 'LLMParsingError';
  }
}

export class InvalidGPTConversationError extends ValidationError {
  constructor(message: string = 'errors.invalidGptConversation') {
    super(message);
    this.name = 'InvalidGPTConversationError';
  }
}

export class NoTimeError extends ValidationError {
  constructor(message: string = 'errors.noTime') {
    super(message);
    this.name = 'NoTimeError';
  }
}

export class NoActivityError extends ValidationError {
  constructor(message: string = 'errors.noActivity') {
    super(message);
    this.name = 'NoActivityError';
  }
}

export class PastTimeError extends ValidationError {
  constructor(message: string = 'errors.pastTime') {
    super(message);
    this.name = 'PastTimeError';
  }
}

export class PastTimeEditError extends ValidationError {
  constructor(message: string = 'errors.editPastDate') {
    super(message);
    this.name = 'PastTimeEditError';
  }
}

export class NoActivityAndTimeError extends ValidationError {
  constructor(message: string = 'errors.noActivityAndTime') {
    super(message);
    this.name = 'NoActivityAndTimeError';
  }
}

export class InvalidTimeFormatError extends ValidationError {
  constructor(message: string = 'errors.invalidTimeFormat') {
    super(message);
    this.name = 'InvalidTimeFormatError';
  }
}

export class DuplicateDataError extends ValidationError {
  constructor(message: string = 'errors.duplicateData') {
    super(message);
    this.name = 'DuplicateDataError';
  }
}

export class HttpError extends Error {
  status: number;
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string = 'errors.badRequest') {
    super(message, 400);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'errors.unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = 'errors.forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = 'errors.notFound') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class MethodNotAllowedError extends HttpError {
  constructor(message: string = 'errors.methodNotAllowed') {
    super(message, 405);
    this.name = 'MethodNotAllowedError';
  }
}

export class ConflictError extends HttpError {
  constructor(message: string = 'errors.conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

export class UnprocessableEntityError extends HttpError {
  constructor(message: string = 'errors.unprocessableEntity') {
    super(message, 422);
    this.name = 'UnprocessableEntityError';
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(message: string = 'errors.tooManyRequests') {
    super(message, 429);
    this.name = 'TooManyRequestsError';
  }
}

export class InternalServerError extends HttpError {
  constructor(message: string = 'errors.internalServer') {
    super(message, 500);
    this.name = 'InternalServerError';
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message: string = 'errors.serviceUnavailable') {
    super(message, 503);
    this.name = 'ServiceUnavailableError';
  }
}

export class DatabaseConnectionError extends HttpError {
  constructor(message: string = 'errors.databaseConnection') {
    super(message, 503);
    this.name = 'DatabaseConnectionError';
  }
}

export class DatabaseQueryError extends HttpError {
  constructor(message: string = 'errors.databaseQuery') {
    super(message, 500);
    this.name = 'DatabaseQueryError';
  }
}

export class DatabaseTimeoutError extends HttpError {
  constructor(message: string = 'errors.databaseTimeout') {
    super(message, 504);
    this.name = 'DatabaseTimeoutError';
  }
}

export class AbuseError extends HttpError {
  constructor(message: string = 'errors.abuse') {
    super(message, 403);
    this.name = 'AbuseError';
  }
}

export class DailyUsageLimitExceededError extends HttpError {
  constructor(message: string = 'errors.dailyUsageLimitExceeded') {
    super(message, 429);
    this.name = 'DailyUsageLimitExceededError';
  }
}

export class ValidationError extends Error {
  status: number;
  constructor(message: string = 'Błąd walidacji') {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

export class EmptyInputError extends ValidationError {
  constructor(message: string = 'Wprowadź aktywność i czas') {
    super(message);
    this.name = 'EmptyInputError';
  }
}

export class LLMParsingError extends ValidationError {
  constructor(message: string = 'Nie udało się sparsować tekstu przez AI') {
    super(message);
    this.name = 'LLMParsingError';
  }
}

export class InvalidGPTConversationError extends ValidationError {
  constructor(message: string = 'GPT może odpowiadać tylko na pytania dotyczące ustawiania przypomnień') {
    super(message);
    this.name = 'InvalidGPTConversationError';
  }
}

export class NoTimeError extends ValidationError {
  constructor(message: string = 'Nie podano godziny przypomnienia') {
    super(message);
    this.name = 'NoTimeError';
  }
}

export class NoActivityError extends ValidationError {
  constructor(message: string = 'Nie podano aktywności') {
    super(message);
    this.name = 'NoActivityError';
  }
}

export class PastTimeError extends ValidationError {
  constructor(message: string = 'Nie można ustawić przypomnienia w przeszłości') {
    super(message);
    this.name = 'PastTimeError';
  }
}

export class NoActivityAndTimeError extends ValidationError {
  constructor(message: string = 'Nie podano aktywności ani czasu') {
    super(message);
    this.name = 'NoActivityAndTimeError';
  }
}

export class InvalidTimeFormatError extends ValidationError {
  constructor(message: string = 'Nieprawidłowy format godziny. Użyj formatu HH:MM lub HH (np. 14:00, 15:30, 14)') {
    super(message);
    this.name = 'InvalidTimeFormatError';
  }
}

export class DuplicateDataError extends ValidationError {
  constructor(message: string = 'Wykryto duplikaty w danych. Podaj tylko jedną aktywność i jeden czas') {
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
  constructor(message: string = 'Błędne żądanie') {
    super(message, 400);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Brak autoryzacji') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = 'Brak uprawnień') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = 'Nie znaleziono zasobu') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class MethodNotAllowedError extends HttpError {
  constructor(message: string = 'Metoda nie jest dozwolona') {
    super(message, 405);
    this.name = 'MethodNotAllowedError';
  }
}

export class ConflictError extends HttpError {
  constructor(message: string = 'Konflikt zasobów') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

export class UnprocessableEntityError extends HttpError {
  constructor(message: string = 'Nieprawidłowe dane') {
    super(message, 422);
    this.name = 'UnprocessableEntityError';
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(message: string = 'Zbyt wiele żądań') {
    super(message, 429);
    this.name = 'TooManyRequestsError';
  }
}

export class InternalServerError extends HttpError {
  constructor(message: string = 'Błąd serwera') {
    super(message, 500);
    this.name = 'InternalServerError';
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message: string = 'Serwis niedostępny') {
    super(message, 503);
    this.name = 'ServiceUnavailableError';
  }
}

export class ConnectionError extends HttpError {
  constructor(message: string = 'Błąd połączenia z serwerem') {
    super(message, 503);
    this.name = 'ConnectionError';
  }
}

export class AbuseError extends HttpError {
  constructor(message: string = 'Wykryto nieprawidłowe użycie aplikacji') {
    super(message, 403);
    this.name = 'AbuseError';
  }
} 
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

export class InvalidTimeError extends ValidationError {
  constructor(message: string = 'Podaj prawidłowy czas z aktywnością') {
    super(message);
    this.name = 'InvalidTimeError';
  }
}

export class EmptyActivityError extends ValidationError {
  constructor(message: string = 'Podaj o czym chcesz być przypomniany') {
    super(message);
    this.name = 'EmptyActivityError';
  }
}

export class PastDateError extends ValidationError {
  constructor(message: string = 'Nie można tworzyć przypomnień dla dat z przeszłości') {
    super(message);
    this.name = 'PastDateError';
  }
}

// HTTP Error Classes
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
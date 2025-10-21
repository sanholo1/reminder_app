import { ConnectionError } from '../connectionService';

// Helper function to handle error translation
export const getErrorMessage = (error: any, t: (key: string, params?: Record<string, string | number>) => string, fallbackKey?: string): string => {
  // Sprawdź czy błąd ma klucz tłumaczenia
  if (error?.translationKey) {
    return t(error.translationKey);
  }
  
  // Sprawdź specyficzne typy błędów po nazwie
  if (error?.name === 'PastTimeEditError') {
    return t('errors.editPastDate');
  }
  
  if (error?.name === 'ValidationError' && error?.message?.startsWith('errors.')) {
    return t(error.message);
  }
  
  if (error?.name && error?.message?.startsWith('errors.')) {
    // Sprawdź czy to błąd z parametrami
    if (error.message === 'errors.activityTooLong') {
      return t(error.message, { length: 200 });
    }
    return t(error.message);
  }
  
  // Jeśli to ConnectionError, użyj oryginalnego message (może być już przetłumaczone)
  if (error instanceof ConnectionError) {
    // Sprawdź czy message to klucz tłumaczenia
    if (error.message?.startsWith('errors.')) {
      return t(error.message);
    }
    return error.message;
  }
  
  // Używaj fallback klucza lub domyślnego
  return error?.message || t(fallbackKey || 'errors.unknown');
};
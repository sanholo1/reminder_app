import { logger } from './utils/logger';
export class ConnectionError extends Error {
  name: string;
  translationKey?: string;
  
  constructor(message: string, name?: string, translationKey?: string) {
    super(message);
    this.name = name || 'ConnectionError';
    this.translationKey = translationKey;
  }
}

export interface ConnectionResponse<T = any> {
  data: T;
  remainingAttempts?: number;
  dailyRemaining?: number;
  dailyUsageCount?: number;
  dailyMaxUsage?: number;
  dailyResetAt?: string;
  warning?: string;
}

export class ConnectionService {
  async request<T = any>(url: string, options?: RequestInit): Promise<ConnectionResponse<T>> {
    try {
      const startedAt = performance.now();
      const headers: Record<string, string> = { ...(options && (options.headers as any)) };
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(url, { ...(options || {}), headers });
      if (!res.ok) {
        let errorMessage = `Błąd połączenia: ${res.status} ${res.statusText}`;
        let errorName = 'ConnectionError';
        let translationKey: string | undefined;
        
        try {
          const errorData = await res.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
          if (errorData && errorData.name) {
            errorName = errorData.name;
          }
          // Sprawdź czy message to klucz tłumaczenia
          if (errorMessage && errorMessage.startsWith('errors.')) {
            translationKey = errorMessage;
          }
        } catch (parseError) {
          if (res.status >= 500) {
            errorMessage = 'Serwer nie jest dostępny';
          }
        }
        logger.warn('HTTP error', { url, status: res.status, statusText: res.statusText });
        throw new ConnectionError(errorMessage, errorName, translationKey);
      }
      const data = await res.json();
      const durationMs = Math.round(performance.now() - startedAt);
      logger.info('HTTP', { url, method: (options && options.method) || 'GET', durationMs });
      return {
        data,
        remainingAttempts: res.headers.get('X-Remaining-Attempts') ? parseInt(res.headers.get('X-Remaining-Attempts')!) : undefined,
        dailyRemaining: res.headers.get('X-Daily-Remaining-Usage') ? parseInt(res.headers.get('X-Daily-Remaining-Usage')!) : undefined,
        dailyUsageCount: res.headers.get('X-Daily-Usage-Count') ? parseInt(res.headers.get('X-Daily-Usage-Count')!) : undefined,
        dailyMaxUsage: res.headers.get('X-Daily-Max-Usage') ? parseInt(res.headers.get('X-Daily-Max-Usage')!) : undefined,
        dailyResetAt: res.headers.get('X-Daily-Reset-At') || undefined,
        warning: res.headers.get('X-Warning') || undefined
      };
    } catch (err: any) {
      if (err instanceof ConnectionError) {
        throw err;
      }
      logger.error('HTTP exception', { url, error: err?.message || String(err) });
      throw new ConnectionError(err.message || 'Nieznany błąd połączenia');
    }
  }

  async deleteReminder(id: string): Promise<ConnectionResponse> {
    return this.request(`/reminders/${id}`, {
      method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
    });
  }

  async deleteCategory(category: string): Promise<ConnectionResponse> {
    return this.request(`/categories/${encodeURIComponent(category)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getTrashItems(): Promise<ConnectionResponse> {
    return this.request('/trash', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async restoreFromTrash(id: string): Promise<ConnectionResponse> {
    return this.request(`/trash/${id}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async updateReminder(id: string, body: { activity?: string; datetime?: string }): Promise<ConnectionResponse> {
    return this.request(`/reminders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }
} 
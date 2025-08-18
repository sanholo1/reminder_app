export class ConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConnectionError';
  }
}

export interface ConnectionResponse<T = any> {
  data: T;
  remainingAttempts?: number;
  dailyRemaining?: number;
  dailyResetAt?: string;
  warning?: string;
}

export class ConnectionService {
  async request<T = any>(url: string, options?: RequestInit): Promise<ConnectionResponse<T>> {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        let errorMessage = `Błąd połączenia: ${res.status} ${res.statusText}`;
        
        try {
          const errorData = await res.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // Gdy nie można sparsować odpowiedzi błędu
          if (res.status >= 500) {
            errorMessage = 'Serwer nie jest dostępny';
          }
        }
        
        throw new ConnectionError(errorMessage);
      }
      const data = await res.json();
      
      return {
        data,
        remainingAttempts: res.headers.get('X-Remaining-Attempts') ? 
          parseInt(res.headers.get('X-Remaining-Attempts')!) : undefined,
        dailyRemaining: res.headers.get('X-Daily-Remaining') ? 
          parseInt(res.headers.get('X-Daily-Remaining')!) : undefined,
        dailyResetAt: res.headers.get('X-Daily-Reset-At') || undefined,
        warning: res.headers.get('X-Warning') || undefined
      };
    } catch (err: any) {
      if (err instanceof ConnectionError) {
        throw err;
      }
      
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
} 
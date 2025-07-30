export class ConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConnectionError';
  }
}

export class ConnectionService {
  async request<T = any>(url: string, options?: RequestInit): Promise<T> {
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
        }
        
        throw new ConnectionError(errorMessage);
      }
      const data = await res.json();
      return data;
    } catch (err: any) {
      if (err instanceof ConnectionError) {
        throw err;
      }
      throw new ConnectionError(err.message || 'Nieznany błąd połączenia');
    }
  }
} 
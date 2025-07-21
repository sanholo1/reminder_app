import React, { useState, useEffect } from 'react';

interface Reminder {
  id: string;
  activity: string;
  datetime: string;
  created_at: string;
}

function App() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ activity: string; datetime: string | null; error?: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const res = await fetch('/reminders');
      if (!res.ok) {
        throw new Error('Błąd pobierania przypomnień');
      }
      const data = await res.json();
      setReminders(data.reminders || []);
    } catch (err: any) {
      console.error('Błąd pobierania przypomnień:', err);
    } finally {
      setLoadingReminders(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });

      if (!res.ok) {
        throw new Error('Błąd połączenia z serwerem...');
      }

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        setInput('');
        await fetchReminders();
      }

    } catch (err: any) {
      setError(err.message || 'Nieznany błąd...');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="title">Aplikacja Przypomnień</h1>
      <p className="subtitle">Twórz inteligentne przypomnienia używając języka naturalnego</p>

      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="input"
          placeholder="np. kup mleko jutro o 15"
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()} 
          className="button"
        >
          {loading ? 'Tworzenie...' : 'Utwórz Przypomnienie'}
        </button>
      </form>

      {loading && (
        <div className="loading">
          Przetwarzanie przypomnienia...
        </div>
      )}

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {result && !result.error && (
        <div className="result">
          <div className="result-item">
            <div className="result-label">Aktywność:</div>
            <div className="result-value">
              {result.activity}
            </div>
          </div>
          <div className="result-item">
            <div className="result-label">Data i Czas:</div>
            <div className="result-value">
              {result.datetime ? result.datetime : 'Czas nie został rozpoznany'}
            </div>
          </div>
        </div>
      )}

      <div className="reminders-section">
        <h2 className="reminders-title">Lista Przypomnień</h2>
        
        {loadingReminders ? (
          <div className="loading">Ładowanie przypomnień...</div>
        ) : reminders.length === 0 ? (
          <div className="no-reminders">Brak przypomnień</div>
        ) : (
          <div className="reminders-list">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="reminder-item">
                <div className="reminder-activity">{reminder.activity}</div>
                <div className="reminder-datetime">{reminder.datetime}</div>
                <div className="reminder-created">Utworzono: {reminder.created_at}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

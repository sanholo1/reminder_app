import React, { useState, useEffect } from 'react';
import { ConnectionService, ConnectionError } from '../connectionService';
import ReminderList from '../components/ReminderList';
import ReminderForm from '../components/ReminderForm';
import ReminderResult from '../components/ReminderResult';

interface Reminder {
  id: string;
  activity: string;
  datetime: string;
  created_at: string;
}

const HomePage: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ activity: string; datetime: string | null; error?: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(true);
  const connectionService = new ConnectionService();

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const data = await connectionService.request<{ reminders: Reminder[] }>('/reminders');
      setReminders(data.reminders || []);
    } catch (err: any) {
      if (err instanceof ConnectionError) {
        console.error('Błąd połączenia:', err.message);
      } else {
        console.error('Błąd pobierania przypomnień:', err);
      }
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
      const data = await connectionService.request<{ activity: string; datetime: string | null; error?: string | null }>('/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        setInput('');
        await fetchReminders();
      }
    } catch (err: any) {
      if (err instanceof ConnectionError) {
        setError(err.message);
      } else {
        setError(err.message || 'Nieznany błąd...');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredReminders = reminders;
  const filteredResult = result;

  return (
    <>
      <h1 className="title">Reminder App</h1>
      <p className="subtitle">Twórz inteligentne przypomnienia używając naturalnego języka</p>
      <ReminderForm input={input} setInput={setInput} loading={loading} handleSubmit={handleSubmit} />
      <div style={{ height: '1.5rem' }} />
      {loading && <div className="loading">Przetwarzanie przypomnienia...</div>}
      {error && <div className="error">{error}</div>}
      <ReminderResult result={filteredResult} />
      <div className="reminders-section">
        <ReminderList reminders={filteredReminders} loadingReminders={loadingReminders} />
      </div>
    </>
  );
};

export default HomePage; 
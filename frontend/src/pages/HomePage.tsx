import React, { useState, useEffect } from 'react';
import { ConnectionService, ConnectionError, ConnectionResponse } from '../connectionService';
import ReminderList from '../components/ReminderList';
import ReminderForm from '../components/ReminderForm';
import ReminderResult from '../components/ReminderResult';

interface Reminder {
  id: string;
  activity: string;
  datetime: string;
  category?: string | null;
  created_at: string;
}

type HomePageProps = {
  onRefreshUsage?: () => void;
};

const HomePage: React.FC<HomePageProps> = ({ onRefreshUsage }) => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ activity: string; datetime: string | null; error?: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const connectionService = new ConnectionService();

  useEffect(() => {
    fetchReminders();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory !== undefined) {
      fetchReminders();
    }
  }, [selectedCategory]);

  const fetchReminders = async () => {
    try {
      let response;
      if (selectedCategory) {
        response = await connectionService.request<{ reminders: Reminder[] }>(`/reminders/category/${encodeURIComponent(selectedCategory)}`);
      } else {
        response = await connectionService.request<{ reminders: Reminder[] }>('/reminders');
      }
      const data = response.data;
      console.log('Daty z backendu:', data.reminders.map(r => ({ id: r.id, datetime: r.datetime })));
      const remindersWithLocalTime = data.reminders.map(reminder => {
        const localDateTime = new Date(reminder.datetime).toLocaleString('pl-PL', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        console.log(`Konwersja: ${reminder.datetime} -> ${localDateTime}`);
        return {
          ...reminder,
          datetime: localDateTime,
          created_at: reminder.created_at ? new Date(reminder.created_at).toLocaleString('pl-PL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }) : ''
        };
      });
      setReminders(remindersWithLocalTime || []);
      if (onRefreshUsage) onRefreshUsage();
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

  const fetchCategories = async () => {
    try {
      const response = await connectionService.request<{ categories: string[] }>('/categories');
      setCategories(response.data.categories || []);
    } catch (err: any) {
      if (err instanceof ConnectionError) {
        console.error('Błąd połączenia:', err.message);
      } else {
        console.error('Błąd pobierania kategorii:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setWarning(null);
    setResult(null);
    setRemainingAttempts(null);

    try {
      const response = await connectionService.request<{ activity: string; datetime: string | null; error?: string | null }>('/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, category: selectedCategory }),
      });

      const data = response.data;
      
      // Handle warnings and remaining attempts
      if (response.warning) {
        setWarning(response.warning);
      }
      if (response.remainingAttempts !== undefined) {
        setRemainingAttempts(response.remainingAttempts);
      }

      if (data.error) {
        setError(data.error);
        // If it's an abuse error, show remaining attempts
        if (response.remainingAttempts !== undefined) {
          setRemainingAttempts(response.remainingAttempts);
        }
      } else {
        const resultWithLocalTime = {
          ...data,
          datetime: data.datetime ? new Date(data.datetime).toLocaleString('pl-PL', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }) : null
        };
        setResult(resultWithLocalTime);
        setInput('');
        await fetchReminders();
        if (onRefreshUsage) onRefreshUsage();
      }
    } catch (err: any) {
      if (err instanceof ConnectionError) {
        setError(err.message);
        // Try to extract remaining attempts from error message if it's an abuse error
        if (err.message.includes('Pozostało') && err.message.includes('prób')) {
          const match = err.message.match(/Pozostało (\d+) prób/);
          if (match) {
            setRemainingAttempts(parseInt(match[1]));
          }
        }
      } else {
        setError(err.message || 'Nieznany błąd...');
      }
    } finally {
      if (onRefreshUsage) onRefreshUsage();
      setLoading(false);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await connectionService.deleteReminder(id);
      // Refresh the reminders list after successful deletion
      await fetchReminders();
    } catch (err: any) {
      if (err instanceof ConnectionError) {
        setError(err.message);
      } else {
        setError('Błąd podczas usuwania przypomnienia');
      }
    }
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setLoadingReminders(true);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    
    // Add category to local state (it will be created when first reminder is added)
    if (!categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
    }
    setSelectedCategory(newCategory.trim());
    setNewCategory('');
    setShowCategoryForm(false);
    setLoadingReminders(true);
  };

  const handleBackToMain = () => {
    setSelectedCategory(null);
    setLoadingReminders(true);
  };

  const filteredReminders = reminders;
  const filteredResult = result;

  return (
    <>
      <h1 className="title">Reminder App</h1>
      <p className="subtitle">Twórz inteligentne przypomnienia używając naturalnego języka</p>
      
      {/* Category Navigation */}
      <div className="category-navigation">
        {selectedCategory && (
          <button 
            onClick={handleBackToMain}
            className="back-button"
          >
            ← Wróć do głównej
          </button>
        )}
        
        <div className="category-selector">
          <select 
            value={selectedCategory || ''} 
            onChange={(e) => handleCategorySelect(e.target.value || null)}
            className="category-select"
          >
            <option value="">Wszystkie przypomnienia</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <button 
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="new-category-button"
          >
            {showCategoryForm ? 'Anuluj' : '+ Nowa kategoria'}
          </button>
        </div>
        
        {showCategoryForm && (
          <form onSubmit={handleCreateCategory} className="category-form">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nazwa nowej kategorii..."
              className="category-input"
            />
            <button type="submit" disabled={!newCategory.trim()} className="category-submit">
              Utwórz
            </button>
          </form>
        )}
      </div>

      {/* Current Category Display */}
      {selectedCategory && (
        <div className="current-category">
          <h2>Kategoria: {selectedCategory}</h2>
        </div>
      )}
      
      <ReminderForm input={input} setInput={setInput} loading={loading} handleSubmit={handleSubmit} />
      <div style={{ height: '1.5rem' }} />
      {loading && <div className="loading">Przetwarzanie przypomnienia...</div>}
      {error && <div className="error">{error}</div>}
      {warning && <div className="warning">{warning}</div>}
      {remainingAttempts !== null && remainingAttempts < 3 && (
        <div className="attempts-info">
          ⚠️ Pozostało prób: {remainingAttempts}
        </div>
      )}
      <ReminderResult result={filteredResult} />
      <div className="reminders-section">
        <ReminderList 
          reminders={filteredReminders} 
          loadingReminders={loadingReminders} 
          onDeleteReminder={handleDeleteReminder}
        />
      </div>
    </>
  );
};

export default HomePage; 
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ConnectionService, ConnectionError, ConnectionResponse } from '../connectionService';
import ReminderList from '../components/ReminderList';
import EditReminderModal from '../components/EditReminderModal';
import ReminderForm from '../components/ReminderForm';
import ReminderResult from '../components/ReminderResult';
import DeleteCategoryModal from '../components/DeleteCategoryModal';
import TrashList from '../components/TrashList';
import LoadingOverlay from '../components/LoadingOverlay';
import { NotificationService } from '../services/NotificationService';
import { useLanguage } from '../contexts/LanguageContext';

interface Reminder {
  id: string;
  activity: string;
  datetime: string;
  datetimeISO?: string;
  category?: string | null;
  created_at: string;
}

interface TrashItem {
  id: string;
  activity: string;
  datetime: string;
  category?: string | null;
  deleted_at: string;
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [loadingTrash, setLoadingTrash] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [loadingOverlayMessage, setLoadingOverlayMessage] = useState('');
  const [dailyUsageInfo, setDailyUsageInfo] = useState<{
    dailyUsageCount: number;
    maxDailyUsage: number;
    remainingDailyUsage: number;
  } | null>(null);
  const connectionService = useMemo(() => new ConnectionService(), []);
  const notificationService = useMemo(() => new NotificationService(connectionService), [connectionService]);
  const notificationsStartedRef = useRef(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    fetchReminders();
    fetchCategories();
    fetchTrashItems();
    fetchUsageInfo();
    
    if (!notificationsStartedRef.current) {
      notificationService.startChecking();
      notificationsStartedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (selectedCategory !== undefined) {
      fetchReminders();
    }
  }, [selectedCategory]);


  useEffect(() => {
    if (reminders.length > 0 || trashItems.length > 0) {
      fetchReminders();
      fetchTrashItems();
    }
  }, [language]);

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
      const locale = language === 'pl' ? 'pl-PL' : 'en-US';
      const remindersWithLocalTime = data.reminders.map(reminder => {
        const localDateTime = new Date(reminder.datetime).toLocaleString(locale, {
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
          datetimeISO: reminder.datetime,
          datetime: localDateTime,
          created_at: reminder.created_at ? new Date(reminder.created_at).toLocaleString(locale, {
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

  const fetchTrashItems = async () => {
    try {
      setLoadingTrash(true);
      const response = await connectionService.getTrashItems();
      const data = response.data;
      
      const locale = language === 'pl' ? 'pl-PL' : 'en-US';
      const trashItemsWithLocalTime = data.trashItems.map((item: any) => ({
        ...item,
        datetime: new Date(item.datetime).toLocaleString(locale, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        deleted_at: new Date(item.deleted_at).toLocaleString(locale, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        created_at: item.created_at ? new Date(item.created_at).toLocaleString(locale, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }) : ''
      }));
      
      setTrashItems(trashItemsWithLocalTime || []);
    } catch (err: any) {
      if (err instanceof ConnectionError) {
        console.error('Błąd połączenia:', err.message);
      } else {
        console.error('Błąd pobierania kosza:', err);
      }
    } finally {
      setLoadingTrash(false);
    }
  };

  const fetchUsageInfo = async () => {
    try {
      const response = await connectionService.request<{
        dailyUsageCount: number;
        maxDailyUsage: number;
        remainingDailyUsage: number;
      }>('/usage');
      setDailyUsageInfo(response.data);
    } catch (err: any) {
      if (err instanceof ConnectionError) {
        console.error('Błąd połączenia podczas pobierania informacji o użyciu:', err.message);
        setDailyUsageInfo({
          dailyUsageCount: 0,
          maxDailyUsage: 20,
          remainingDailyUsage: 20
        });
      } else {
        console.error('Błąd pobierania informacji o użyciu:', err);
        
        setDailyUsageInfo({
          dailyUsageCount: 0,
          maxDailyUsage: 20,
          remainingDailyUsage: 20
        });
      }
    }
  };

  const handleDeleteReminder = async (id: string) => {
    setShowLoadingOverlay(true);
    setLoadingOverlayMessage(t('loading.deletingReminder'));
    
    try {
      await connectionService.deleteReminder(id);

      await fetchReminders();

      await fetchTrashItems();
    } catch (err: any) {
      if (err instanceof ConnectionError) {
        setError(err.message);
      } else {
        setError(t('errors.deleteReminder'));
      }
    } finally {
      setShowLoadingOverlay(false);
    }
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setLoadingReminders(true);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    

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

  const handleDeleteCategory = (category: string) => {
    setDeletingCategory(category);
    setShowDeleteModal(true);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    
    setIsDeletingCategory(true);
    setShowLoadingOverlay(true);
    setLoadingOverlayMessage(t('loading.deletingCategory'));
    
    try {
      await connectionService.deleteCategory(deletingCategory);
      

      setCategories(categories.filter(cat => cat !== deletingCategory));
      

      if (selectedCategory === deletingCategory) {
        setSelectedCategory(null);
      }
      

      await fetchReminders();
      
      setShowDeleteModal(false);
      setDeletingCategory(null);
    } catch (err: any) {
      if (err instanceof ConnectionError) {
        setError(err.message);
      } else {
        setError(t('errors.deleteCategory'));
      }
    } finally {
      setIsDeletingCategory(false);
      setShowLoadingOverlay(false);
    }
  };

  const handleCancelDeleteCategory = () => {
    setShowDeleteModal(false);
    setDeletingCategory(null);
  };

  const handleRestoreFromTrash = async (id: string) => {
    setShowLoadingOverlay(true);
    setLoadingOverlayMessage(t('loading.restoring'));
    
    try {
      await connectionService.restoreFromTrash(id);

      await fetchReminders();
      await fetchTrashItems();
    } catch (err: any) {
      if (err instanceof ConnectionError) {
        setError(err.message);
      } else {
        setError(t('errors.restoreFromTrash'));
      }
    } finally {
      setShowLoadingOverlay(false);
    }
  };

  const handleToggleTrash = () => {
    setShowTrash(!showTrash);
  };


  const checkInternetConnection = async (): Promise<boolean> => {
    try {

      const response = await fetch('https://www.google.com/favicon.ico', { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      return true;
    } catch (error) {

      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setWarning(null);
    setResult(null);
    setRemainingAttempts(null);


    const isOnline = await checkInternetConnection();
    if (!isOnline) {
      setError(t('errors.noInternet'));
      setLoading(false);
      return;
    }

    try {
      const response = await connectionService.request<{ activity: string; datetime: string | null; error?: string | null }>('/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, category: selectedCategory }),
      });

      const data = response.data;
      

      if (response.warning) {
        setWarning(response.warning);
      }
      if (response.remainingAttempts !== undefined) {
        setRemainingAttempts(response.remainingAttempts);
      }

      if (data.error) {
        setError(data.error);

        if (response.remainingAttempts !== undefined) {
          setRemainingAttempts(response.remainingAttempts);
        }
      } else {
        const locale = language === 'pl' ? 'pl-PL' : 'en-US';
        const resultWithLocalTime = {
          ...data,
          datetime: data.datetime ? new Date(data.datetime).toLocaleString(locale, {
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
        
        setRemainingAttempts(null);
        
        if (response.dailyUsageCount !== undefined && response.dailyMaxUsage !== undefined && response.dailyRemaining !== undefined) {
          setDailyUsageInfo({
            dailyUsageCount: response.dailyUsageCount,
            maxDailyUsage: response.dailyMaxUsage,
            remainingDailyUsage: response.dailyRemaining
          });
        } else {
          await fetchUsageInfo();
        }
        
        await fetchReminders();
        if (onRefreshUsage) onRefreshUsage();
      }
    } catch (err: any) {
      if (err instanceof ConnectionError) {
        setError(err.message);
        if (err.message.includes('Pozostało') && err.message.includes('prób')) {
          const match = err.message.match(/Pozostało (\d+) prób/);
          if (match) {
            setRemainingAttempts(parseInt(match[1]));
          }
        }
      } else {
        setError(err.message || t('errors.unknown'));
      }
    } finally {
      if (onRefreshUsage) onRefreshUsage();
      setLoading(false);
    }
  };

  const filteredReminders = reminders;
  const filteredResult = result;

  return (
    <>
      <h1 className="title">{t('app.title')}</h1>
      <p className="subtitle">{t('app.subtitle')}</p>
      
      <div className="category-navigation">
        {selectedCategory && (
          <button 
            onClick={handleBackToMain}
            className="back-button"
          >
            {t('categories.back')}
          </button>
        )}
        
        <div className="category-selector">
          <select 
            value={selectedCategory || ''} 
            onChange={(e) => handleCategorySelect(e.target.value || null)}
            className="category-select"
          >
            <option value="">{t('reminders.all')}</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <button 
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="new-category-button"
          >
            {showCategoryForm ? t('categories.cancel') : t('categories.new')}
          </button>
          
          <button 
            onClick={handleToggleTrash}
            className="trash-toggle-button"
            title={`${showTrash ? t('trash.hide') : t('trash.show')} (${trashItems.length} elementów)`}
          >
             {showTrash ? t('trash.hide') : `${t('trash.title')} (${trashItems.length})`}
          </button>
        </div>
        
        {showCategoryForm && (
          <form onSubmit={handleCreateCategory} className="category-form">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder={t('categories.placeholder')}
              className="category-input"
            />
            <button type="submit" disabled={!newCategory.trim()} className="category-submit">
              {t('categories.create')}
            </button>
          </form>
        )}
      </div>

      {selectedCategory && (
        <div className="current-category">
          <h2>{t('categories.title')} {selectedCategory}</h2>
          <button 
            onClick={() => handleDeleteCategory(selectedCategory)}
            className="delete-category-button"
            title={t('categories.delete')}
          >
            🗑️ {t('categories.delete')}
          </button>
        </div>
      )}
      
      <ReminderForm 
        input={input} 
        setInput={setInput} 
        loading={loading} 
        handleSubmit={handleSubmit} 
        dailyUsageInfo={dailyUsageInfo}
      />
      
      <div className="notification-test">
        <button 
          onClick={() => notificationService.testSound()}
          className="test-sound-button"
          title={t('notifications.testTitle')}
        >
          {t('notifications.testSound')}
        </button>
      </div>
      
      <div style={{ height: '1.5rem' }} />
      {loading && <div className="loading">{t('form.processing')}</div>}
      {error && <div className="error">{error}</div>}
      {warning && <div className="warning">{warning}</div>}
      {remainingAttempts !== null && remainingAttempts < 3 && (
        <div className="attempts-info">
          ⚠️ {t('usage.remainingAttempts')} {remainingAttempts}
        </div>
      )}
      <ReminderResult result={filteredResult} />
      {showTrash && (
        <div className="trash-section">
          <TrashList 
            trashItems={trashItems} 
            loadingTrash={loadingTrash} 
            onRestoreItem={handleRestoreFromTrash}
          />
        </div>
      )}
      
      <div className="reminders-section">
        <ReminderList 
          reminders={filteredReminders} 
          loadingReminders={loadingReminders} 
          onDeleteReminder={handleDeleteReminder}
          onUpdateReminder={async (id, payload) => {
            try {
              await connectionService.updateReminder(id, payload);
              await fetchReminders();
            } catch (e: any) {
              setError(e?.message || 'Błąd podczas aktualizacji przypomnienia');
            }
          }}
        />
      </div>

      {/* inline edit replaces modal */}

      <DeleteCategoryModal
        isOpen={showDeleteModal}
        category={deletingCategory || ''}
        reminderCount={reminders.length}
        onConfirm={handleConfirmDeleteCategory}
        onCancel={handleCancelDeleteCategory}
        isDeleting={isDeletingCategory}
      />
      
      <LoadingOverlay 
        isVisible={showLoadingOverlay} 
        message={loadingOverlayMessage}
        transparent={true}
      />
    </>
  );
};

export default HomePage; 
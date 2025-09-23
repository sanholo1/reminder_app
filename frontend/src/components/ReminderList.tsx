import React from 'react';
import ReminderListItem from './ReminderListItem';
import { useLanguage } from '../contexts/LanguageContext';

interface Reminder {
  id: string;
  activity: string;
  datetime: string;
  
  datetimeISO?: string;
  category?: string | null;
  created_at: string;
}

interface ReminderListProps {
  reminders: Reminder[];
  loadingReminders: boolean;
  onDeleteReminder: (id: string) => void;
}

const ReminderList: React.FC<ReminderListProps> = ({ reminders, loadingReminders, onDeleteReminder }) => {
  const { t } = useLanguage();

  
  const groups = React.useMemo(() => {
    const map = new Map<string, Reminder[]>();
    for (const r of reminders) {
      
      const d = new Date(r.datetimeISO || r.datetime);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const key = `${year}-${month}-${day}`;
      const arr = map.get(key) || [];
      arr.push(r);
      map.set(key, arr);
    }
    
    const sorted = Array.from(map.entries()).sort((a, b) => (a[0] > b[0] ? -1 : a[0] < b[0] ? 1 : 0));
    for (const [, arr] of sorted) {
      arr.sort((a, b) => new Date(a.datetimeISO || a.datetime).getTime() - new Date(b.datetimeISO || b.datetime).getTime());
    }
    return sorted;
  }, [reminders]);

  const formatDateHeader = (key: string) => {
    
    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(y, (m || 1) - 1, d || 1);
      
    return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="reminders-section">
      <h2 className="reminders-title">{t('reminders.title')}</h2>
      {loadingReminders ? (
        <div className="loading">{t('reminders.loading')}</div>
      ) : reminders.length === 0 ? (
        <div className="no-reminders">{t('reminders.empty')}</div>
      ) : (
        <div className="reminders-list">
          {groups.map(([dateKey, items]) => (
            <div key={dateKey} className="reminders-group">
              <div className="reminders-group-header">{formatDateHeader(dateKey)}</div>
              <div className="reminders-group-items">
                {items.map((reminder) => (
                  <ReminderListItem
                    key={reminder.id}
                    id={reminder.id}
                    activity={reminder.activity}
                    datetime={reminder.datetime}
                    category={reminder.category}
                    onDelete={onDeleteReminder}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReminderList; 
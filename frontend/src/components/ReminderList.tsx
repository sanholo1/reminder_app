import React from 'react';
import ReminderListItem from './ReminderListItem';
import { useLanguage } from '../contexts/LanguageContext';

interface Reminder {
  id: string;
  activity: string;
  datetime: string;
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
  
  return (
    <div className="reminders-section">
      <h2 className="reminders-title">{t('reminders.title')}</h2>
      {loadingReminders ? (
        <div className="loading">{t('reminders.loading')}</div>
      ) : reminders.length === 0 ? (
        <div className="no-reminders">{t('reminders.empty')}</div>
      ) : (
        <div className="reminders-list">
          {reminders.map((reminder) => (
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
      )}
    </div>
  );
};

export default ReminderList; 
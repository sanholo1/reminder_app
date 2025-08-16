import React from 'react';
import ReminderListItem from './ReminderListItem';

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

const ReminderList: React.FC<ReminderListProps> = ({ reminders, loadingReminders, onDeleteReminder }) => (
  <div className="reminders-section">
    <h2 className="reminders-title">Lista Przypomnień</h2>
    {loadingReminders ? (
      <div className="loading">Ładowanie przypomnień...</div>
    ) : reminders.length === 0 ? (
      <div className="no-reminders">Brak przypomnień</div>
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

export default ReminderList; 
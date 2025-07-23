import React from 'react';
import ReminderListItem from './ReminderListItem';

interface Reminder {
  id: string;
  activity: string;
  datetime: string;
  created_at: string;
}

interface ReminderListProps {
  reminders: Reminder[];
  loadingReminders: boolean;
}

const ReminderList: React.FC<ReminderListProps> = ({ reminders, loadingReminders }) => (
  <div className="reminders-section">
    <h2 className="reminders-title">Lista Przypomnień</h2>
    {loadingReminders ? (
      <div className="loading">Ładowanie przypomnień...</div>
    ) : reminders.length === 0 ? (
      <div className="no-reminders">Brak przypomnień</div>
    ) : (
      <div className="reminders-list">
        {reminders.map((reminder) => (
          <ReminderListItem key={reminder.id} activity={reminder.activity} datetime={reminder.datetime} />
        ))}
      </div>
    )}
  </div>
);

export default ReminderList; 
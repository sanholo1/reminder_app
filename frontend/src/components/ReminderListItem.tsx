import React from 'react';

interface ReminderListItemProps {
  activity: string;
  datetime: string;
}

const ReminderListItem: React.FC<ReminderListItemProps> = ({ activity, datetime }) => (
  <div className="reminder-item">
    <div className="reminder-activity"><strong>{activity}</strong></div>
    <div className="reminder-datetime">{datetime}</div>
  </div>
);

export default ReminderListItem; 
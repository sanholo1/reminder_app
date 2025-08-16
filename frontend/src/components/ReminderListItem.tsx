import React from 'react';

interface ReminderListItemProps {
  id: string;
  activity: string;
  datetime: string;
  onDelete: (id: string) => void;
}

const ReminderListItem: React.FC<ReminderListItemProps> = ({ id, activity, datetime, onDelete }) => (
  <div className="reminder-item">
    <div className="reminder-content">
      <div className="reminder-activity"><strong>{activity}</strong></div>
      <div className="reminder-datetime">{datetime}</div>
    </div>
    <button 
      className="delete-button" 
      onClick={() => onDelete(id)}
      title="Usuń przypomnienie"
    >
      🗑️
    </button>
  </div>
);

export default ReminderListItem; 
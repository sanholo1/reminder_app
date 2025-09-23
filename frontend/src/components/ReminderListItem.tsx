import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ReminderListItemProps {
  id: string;
  activity: string;
  datetime: string;
  datetimeISO?: string;
  category?: string | null;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, payload: { activity?: string; datetime?: string }) => void | Promise<void>;
  isUpdating?: boolean;
}

const ReminderListItem: React.FC<ReminderListItemProps> = ({ id, activity, datetime, datetimeISO, category, onDelete, onUpdate, isUpdating }) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editActivity, setEditActivity] = useState(activity);
  const initialLocal = useMemo(() => {
    try {
      const src = datetimeISO || '';
      if (!src) return '';
      const d = new Date(src);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${y}-${m}-${day}T${hh}:${mm}`;
    } catch {
      return '';
    }
  }, [datetimeISO]);
  const [editDatetimeLocal, setEditDatetimeLocal] = useState(initialLocal);
  
  const saveEdit = async () => {
    if (!onUpdate) {
      setIsEditing(false);
      return;
    }
    const payload: { activity?: string; datetime?: string } = {};
    if (editActivity.trim() && editActivity.trim() !== activity) payload.activity = editActivity.trim();
    if (editDatetimeLocal) {
      const dt = new Date(editDatetimeLocal);
      if (!isNaN(dt.getTime())) payload.datetime = dt.toISOString();
    }
    await onUpdate(id, payload);
    setIsEditing(false);
  };
  
  const handleToggleEdit = async () => {
    if (!isEditing) {
      setIsEditing(true);
      setEditActivity(activity);
      setEditDatetimeLocal(initialLocal);
      return;
    }
    await saveEdit();
  };
  
  return (
    <div className="reminder-item">
      <div className="reminder-content">
        <div className="reminder-activity">
          {isEditing ? (
            <input
              type="text"
              value={editActivity}
              onChange={(e) => setEditActivity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  saveEdit();
                }
              }}
              maxLength={200}
              className="category-input"
              placeholder={t('result.activity') || 'Aktywność'}
              style={{ marginBottom: '0.5rem' }}
            />
          ) : (
            <strong>{activity}</strong>
          )}
        </div>
        <div className="reminder-datetime">
          {isEditing ? (
            <input
              type="datetime-local"
              value={editDatetimeLocal}
              onChange={(e) => setEditDatetimeLocal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  saveEdit();
                }
              }}
              className="category-input"
              style={{ marginBottom: '0.5rem' }}
            />
          ) : (
            datetime
          )}
        </div>
        <div className="reminder-category">
          {category ? <span className="category-badge">{category}</span> : null}
        </div>
      </div>
      <button 
        className="delete-button" 
        onClick={handleToggleEdit}
        title={isEditing ? (t('common.save') || 'Zapisz') : (t('common.edit') || 'Edytuj')}
        style={{ marginRight: '8px' }}
        disabled={!!isUpdating}
      >
        ✏️
      </button>
      <button 
        className="delete-button" 
        onClick={() => onDelete(id)}
        title={t('reminders.delete')}
      >
        🗑️
      </button>
    </div>
  );
};

export default ReminderListItem; 
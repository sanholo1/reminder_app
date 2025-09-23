import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface EditReminderModalProps {
  isOpen: boolean;
  id: string;
  initialActivity: string;
  initialDatetimeISO: string;
  onConfirm: (payload: { activity?: string; datetime?: string }) => Promise<void> | void;
  onCancel: () => void;
  isSaving?: boolean;
}

const EditReminderModal: React.FC<EditReminderModalProps> = ({
  isOpen,
  id,
  initialActivity,
  initialDatetimeISO,
  onConfirm,
  onCancel,
  isSaving
}) => {
  const { t, language } = useLanguage();
  const [activity, setActivity] = useState(initialActivity);
  const [datetime, setDatetime] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    setActivity(initialActivity);
    try {
      const d = new Date(initialDatetimeISO);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      setDatetime(`${y}-${m}-${day}T${hh}:${mm}`);
    } catch {
      setDatetime('');
    }
  }, [initialActivity, initialDatetimeISO]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    const payload: { activity?: string; datetime?: string } = {};
    if (activity.trim() && activity.trim() !== initialActivity) payload.activity = activity.trim();
    if (datetime) {
      const dt = new Date(datetime);
      if (isNaN(dt.getTime())) {
        setErrorText(t('errors.invalidDate') || 'Nieprawidłowa data/godzina');
        return;
      }
      payload.datetime = dt.toISOString();
    }
    if (!payload.activity && !payload.datetime) {
      setErrorText(t('errors.noChanges') || 'Brak zmian do zapisania');
      return;
    }
    await onConfirm(payload);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{t('reminders.editTitle') || 'Edytuj przypomnienie'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="category-form">
          <input
            type="text"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder={t('form.activity') || 'Aktywność'}
            className="category-input"
          />
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            className="category-input"
          />
          <div className="modal-footer">
            {errorText && (
              <div className="error" style={{ width: '100%' }}>
                {errorText}
              </div>
            )}
            <button type="button" onClick={onCancel} className="cancel-button">
              {t('common.cancel') || 'Anuluj'}
            </button>
            <button type="submit" className="new-category-button" disabled={!!isSaving}>
              {isSaving ? (t('common.saving') || 'Zapisywanie...') : (t('common.save') || 'Zapisz')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditReminderModal;



import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ReminderResultProps {
  result: { activity: string; datetime: string | null; error?: string | null } | null;
}

const ReminderResult: React.FC<ReminderResultProps> = ({ result }) => {
  const { t } = useLanguage();
  
  if (!result || result.error) return null;
  return (
    <div className="result">
      <h3 className="result-title">{t('result.title')}</h3>
      <div className="result-item">
        <div className="result-label"><strong>{t('result.activity')}:</strong></div>
        <div className="result-value">{result.activity}</div>
      </div>
      <div className="result-item">
        <div className="result-label"><strong>{t('result.datetime')}:</strong></div>
        <div className="result-value">{result.datetime ? result.datetime : t('result.timeNotRecognized')}</div>
      </div>
    </div>
  );
};

export default ReminderResult; 
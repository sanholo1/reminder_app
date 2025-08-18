import React from 'react';

interface ReminderResultProps {
  result: { activity: string; datetime: string | null; error?: string | null } | null;
}

const ReminderResult: React.FC<ReminderResultProps> = ({ result }) => {
  if (!result || result.error) return null;
  return (
    <div className="result">
      <h3 className="result-title">Ostatnio dodane</h3>
      <div className="result-item">
        <div className="result-label"><strong>Aktywność:</strong></div>
        <div className="result-value">{result.activity}</div>
      </div>
      <div className="result-item">
        <div className="result-label"><strong>Data i Czas:</strong></div>
        <div className="result-value">{result.datetime ? result.datetime : 'Czas nie został rozpoznany'}</div>
      </div>
    </div>
  );
};

export default ReminderResult; 
import React, { useState } from 'react';
import VoiceInput from './VoiceInput';

interface ReminderFormProps {
  input: string;
  setInput: (value: string) => void;
  loading: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  dailyUsageInfo?: {
    dailyUsageCount: number;
    maxDailyUsage: number;
    remainingDailyUsage: number;
  } | null;
}

const ReminderForm: React.FC<ReminderFormProps> = ({ input, setInput, loading, handleSubmit, dailyUsageInfo }) => {
  const [isListening, setIsListening] = useState(false);
  const [voicePreview, setVoicePreview] = useState('');

  const handleVoiceTranscript = (transcript: string) => {
    setInput(transcript);
  };

  const handleVoicePreview = (preview: string) => {
    setVoicePreview(preview);
  };

  return (
    <div>
      {/* Daily Usage Display */}
      {dailyUsageInfo && (
        <div className={`daily-usage-info ${
          dailyUsageInfo.remainingDailyUsage <= 0 ? 'limit-reached' : 
          dailyUsageInfo.remainingDailyUsage <= 5 ? 'approaching-limit' : ''
        }`}>
          <div className="usage-header">
            <span className="usage-icon">📊</span>
            <span className="usage-title">Dzienne użycie</span>
          </div>
          <div className="usage-details">
            <span className="usage-count">
              {dailyUsageInfo ? `${dailyUsageInfo.dailyUsageCount} / ${dailyUsageInfo.maxDailyUsage}` : '0 / 20'}
            </span>
            <span className="usage-remaining">
              Pozostało: {dailyUsageInfo?.remainingDailyUsage ?? 20}
            </span>
          </div>
          <div className="usage-progress">
            <div 
              className="usage-progress-bar" 
              style={{ 
                width: `${dailyUsageInfo ? (dailyUsageInfo.dailyUsageCount / dailyUsageInfo.maxDailyUsage) * 100 : 0}%` 
              }}
            ></div>
          </div>
          <div className="usage-reset-info">
            <small>Limit resetuje się o północy każdego dnia</small>
            {dailyUsageInfo.remainingDailyUsage <= 0 && (
              <div className="limit-reached-message">
                <strong>Dzisiejszy limit został osiągnięty. Spróbuj ponownie jutro!</strong>
              </div>
            )}
            {dailyUsageInfo.remainingDailyUsage > 0 && dailyUsageInfo.remainingDailyUsage <= 5 && (
              <div className="approaching-limit-message">
                <strong>⚠️ Zostało tylko {dailyUsageInfo.remainingDailyUsage} użyć do końca dnia!</strong>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Wpisz przypomnienie lub użyj głosu..."
            className="input"
          />
          <VoiceInput 
            onTranscript={handleVoiceTranscript}
            onPreview={handleVoicePreview}
            disabled={loading}
            isListening={isListening}
            onListeningChange={setIsListening}
          />
        </div>
        {isListening && (
          <div className="voice-status-indicator">
            <span>🎤 Słucham... Mów teraz!</span>
            {voicePreview && (
              <div className="voice-preview">
                <span>Rozpoznany tekst: "{voicePreview}"</span>
              </div>
            )}
          </div>
        )}
        <button
          type="submit"
          disabled={loading || !input.trim() || (dailyUsageInfo?.remainingDailyUsage ?? 0) <= 0}
          className="button"
        >
          {loading ? 'Tworzenie...' : 'Utwórz Przypomnienie'}
        </button>
      </form>
    </div>
  );
};

export default ReminderForm; 
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

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
  
  const { t } = useLanguage();
  const {
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    isSupported,
    resetTranscript
  } = useSpeechRecognition();

  // Aktualizacja input gdy dostaniemy transcript z rozpoznawania mowy
  useEffect(() => {
    if (transcript && !isListening) {
      setInput(transcript.trim());
      resetTranscript();
    }
  }, [transcript, isListening, setInput, resetTranscript]);

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
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
            <span className="usage-title">{t('usage.title')}</span>
          </div>
          <div className="usage-details">
            <span className="usage-count">
              {dailyUsageInfo ? `${dailyUsageInfo.dailyUsageCount} / ${dailyUsageInfo.maxDailyUsage}` : '0 / 20'}
            </span>
            <span className="usage-remaining">
              {t('usage.remaining')} {dailyUsageInfo?.remainingDailyUsage ?? 20}
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
            <small>{t('usage.resetInfo')}</small>
            {dailyUsageInfo.remainingDailyUsage <= 0 && (
              <div className="limit-reached-message">
                <strong>{t('usage.limitReached')}</strong>
              </div>
            )}
            {dailyUsageInfo.remainingDailyUsage > 0 && dailyUsageInfo.remainingDailyUsage <= 5 && (
              <div className="approaching-limit-message">
                <strong>{t('usage.approachingLimit', { count: dailyUsageInfo.remainingDailyUsage })}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        <div className="input-container">
          <input
            type="text"
            value={input || transcript}
            onChange={e => setInput(e.target.value)}
            placeholder={t('form.placeholder')}
            maxLength={200}
            className="input"
          />
          
          {/* Przycisk mikrofonu */}
          {isSupported && (
            <button
              type="button"
              onClick={handleVoiceToggle}
              disabled={loading}
              className={`voice-button ${isListening ? 'listening' : ''}`}
              title={isListening ? t('voice.clickToStop') : t('voice.clickToSpeak')}
            >
              {isListening ? '🔴' : '🎤'}
            </button>
          )}
        </div>

        {/* Status głosowy */}
        {isListening && (
          <div className="voice-status-indicator">
            🎤 {t('voice.listening')}
          </div>
        )}

        {/* Podgląd rozpoznanego tekstu */}
        {transcript && isListening && (
          <div className="voice-preview">
            <strong>{t('voice.recognized')}</strong> {transcript}
          </div>
        )}

        {/* Błędy rozpoznawania mowy */}
        {speechError && (
          <div className="error">
            {speechError}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading || !input.trim() || (dailyUsageInfo?.remainingDailyUsage ?? 0) <= 0}
          className="button"
        >
          {loading ? t('form.creating') : t('form.submit')}
        </button>
      </form>
    </div>
  );
};

export default ReminderForm; 
import React, { useState } from 'react';
import VoiceInput from './VoiceInput';

interface ReminderFormProps {
  input: string;
  setInput: (value: string) => void;
  loading: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}

const ReminderForm: React.FC<ReminderFormProps> = ({ input, setInput, loading, handleSubmit }) => {
  const [isListening, setIsListening] = useState(false);
  const [voicePreview, setVoicePreview] = useState('');

  const handleVoiceTranscript = (transcript: string) => {
    setInput(transcript);
  };

  const handleVoicePreview = (preview: string) => {
    setVoicePreview(preview);
  };

  return (
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
        disabled={loading || !input.trim()}
        className="button"
      >
        {loading ? 'Tworzenie...' : 'Utwórz Przypomnienie'}
      </button>
    </form>
  );
};

export default ReminderForm; 
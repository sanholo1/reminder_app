import { useState, useRef, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
  resetTranscript: () => void;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const { language, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Sprawdzanie obsługi przez przeglądarkę
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const initializeRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    // Konfiguracja
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === 'pl' ? 'pl-PL' : 'en-US';
    recognition.maxAlternatives = 1;

    // Obsługa zdarzeń
    recognition.onstart = () => {
      console.log('Rozpoznawanie mowy zostało uruchomione');
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Błąd rozpoznawania mowy:', event.error);
      setIsListening(false);
      
      switch (event.error) {
        case 'no-speech':
          setError(t('voice.noSpeech'));
          break;
        case 'audio-capture':
          setError(t('voice.audioCapture'));
          break;
        case 'not-allowed':
          setError(t('voice.notAllowed'));
          break;
        case 'network':
          setError(t('voice.network'));
          break;
        default:
          setError(t('voice.error'));
      }
    };

    recognition.onend = () => {
      console.log('Rozpoznawanie mowy zostało zakończone');
      setIsListening(false);
    };

    return recognition;
  }, [language, t, isSupported]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError(t('voice.notSupported'));
      return;
    }

    try {
      recognitionRef.current = initializeRecognition();
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setTranscript('');
        setError(null);
      }
    } catch (error) {
      console.error('Błąd uruchamiania rozpoznawania mowy:', error);
      setError(t('voice.startError'));
    }
  }, [initializeRecognition, isSupported, t]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    isSupported,
    resetTranscript
  };
};
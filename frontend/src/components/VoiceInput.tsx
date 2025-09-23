import React, { useState, useRef, useEffect } from 'react';
import './VoiceInput.css';
import { useLanguage } from '../contexts/LanguageContext';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onPreview?: (text: string) => void;
  disabled?: boolean;
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ 
  onTranscript, 
  onPreview,
  disabled = false, 
  isListening, 
  onListeningChange 
}) => {
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentTranscriptRef = useRef<string>('');
  const { t, language } = useLanguage();

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'pl' ? 'pl-PL' : 'en-US'; 
      
      recognition.onstart = () => {
        onListeningChange(true);
        setError(null);
        setTranscript('');
        currentTranscriptRef.current = '';
        if (onPreview) {
          onPreview('');
        }
      };
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        const newTranscript = finalTranscript + interimTranscript;
        setTranscript(newTranscript);
        currentTranscriptRef.current = newTranscript;
        
        if (onPreview) {
          onPreview(newTranscript);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        onListeningChange(false);
        
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
        onListeningChange(false);
        if (currentTranscriptRef.current.trim()) {
          onTranscript(currentTranscriptRef.current.trim());
        }
        if (onPreview) {
          onPreview('');
        }
        setTimeout(() => {
          setTranscript('');
          currentTranscriptRef.current = '';
        }, 1000);
      };
    } else {
      setIsSupported(false);
      setError(t('voice.notSupported'));
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript, onListeningChange, language, t]);

  useEffect(() => {
    return () => {
      setTranscript('');
      currentTranscriptRef.current = '';
      setError(null);
    };
  }, []);

  const toggleListening = () => {
    if (!isSupported || disabled) return;
    
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      setTranscript('');
      currentTranscriptRef.current = '';
      setError(null);
      if (onPreview) {
        onPreview('');
      }
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Error starting speech recognition:', error);
          setError(t('voice.startError'));
        }
      }
    }
  };

  if (!isSupported) {
    return null; 
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      className={`voice-button ${isListening ? 'listening' : ''} ${disabled ? 'disabled' : ''}`}
      title={isListening ? t('voice.clickToStop') : t('voice.clickToSpeak')}
    >
      {isListening ? '🔴' : '🎤'}
    </button>
  );
};

export default VoiceInput;

import React, { useState, useRef, useEffect } from 'react';
import './VoiceInput.css';

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

  useEffect(() => {
    // Sprawdź czy przeglądarka obsługuje Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'pl-PL'; // Polski język
      
      recognition.onstart = () => {
        onListeningChange(true);
        setError(null);
        setTranscript('');
        currentTranscriptRef.current = '';
        // Resetuj preview
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
        
        // Wyślij preview jeśli funkcja jest dostępna
        if (onPreview) {
          onPreview(newTranscript);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        onListeningChange(false);
        
        switch (event.error) {
          case 'no-speech':
            setError('Nie wykryto mowy. Spróbuj ponownie.');
            break;
          case 'audio-capture':
            setError('Błąd dostępu do mikrofonu. Sprawdź uprawnienia.');
            break;
          case 'not-allowed':
            setError('Dostęp do mikrofonu został zablokowany.');
            break;
          case 'network':
            setError('Błąd sieci. Sprawdź połączenie internetowe.');
            break;
          default:
            setError('Wystąpił błąd rozpoznawania mowy.');
        }
      };
      
      recognition.onend = () => {
        onListeningChange(false);
        // Użyj referencji do aktualnego transcript
        if (currentTranscriptRef.current.trim()) {
          onTranscript(currentTranscriptRef.current.trim());
        }
        // Resetuj preview
        if (onPreview) {
          onPreview('');
        }
        // Resetuj stan po krótkim opóźnieniu, aby użytkownik widział wynik
        setTimeout(() => {
          setTranscript('');
          currentTranscriptRef.current = '';
        }, 1000);
      };
    } else {
      setIsSupported(false);
      setError('Twoja przeglądarka nie obsługuje rozpoznawania mowy.');
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript, onListeningChange]);

  // Resetuj stan gdy komponent się odmontowuje
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
      // Resetuj poprzedni stan przed rozpoczęciem nowej sesji
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
          setError('Nie udało się uruchomić rozpoznawania mowy.');
        }
      }
    }
  };

  if (!isSupported) {
    return null; // Nie pokazuj ikony jeśli nie jest obsługiwane
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      className={`voice-button ${isListening ? 'listening' : ''} ${disabled ? 'disabled' : ''}`}
      title={isListening ? 'Kliknij aby zatrzymać' : 'Kliknij aby mówić'}
    >
      {isListening ? '🔴' : '🎤'}
    </button>
  );
};

export default VoiceInput;

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface UseVoiceInputOptions {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  language?: string;
  continuous?: boolean;
}

interface UseVoiceInputReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
}

export const useVoiceInput = (options: UseVoiceInputOptions = {}): UseVoiceInputReturn => {
  const {
    onResult,
    onError,
    language = 'fr-FR',
    continuous = false,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = continuous;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = language;

    recognitionRef.current.onresult = (event: any) => {
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

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);

      if (finalTranscript && onResult) {
        onResult(finalTranscript);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      const errorMessage = getErrorMessage(event.error);
      if (onError) {
        onError(errorMessage);
      } else {
        toast.error('Erreur reconnaissance vocale', { description: errorMessage });
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isSupported, language, continuous, onResult, onError]);

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'not-allowed':
        return 'Accès au microphone refusé. Veuillez autoriser l\'accès.';
      case 'no-speech':
        return 'Aucune parole détectée. Veuillez réessayer.';
      case 'network':
        return 'Erreur réseau. Vérifiez votre connexion.';
      case 'audio-capture':
        return 'Aucun microphone détecté.';
      default:
        return 'Une erreur est survenue. Veuillez réessayer.';
    }
  };

  const startListening = useCallback(() => {
    if (!isSupported) {
      toast.error('Non supporté', { 
        description: 'La reconnaissance vocale n\'est pas supportée par votre navigateur' 
      });
      return;
    }

    setTranscript('');
    setIsListening(true);
    
    try {
      recognitionRef.current?.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    recognitionRef.current?.stop();
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported,
  };
};

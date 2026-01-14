import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface VoiceInputButtonProps {
  onResult: (transcript: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost';
  showTranscript?: boolean;
}

export const VoiceInputButton = ({
  onResult,
  onListeningChange,
  className,
  size = 'icon',
  variant = 'outline',
  showTranscript = false,
}: VoiceInputButtonProps) => {
  const { isListening, transcript, startListening, stopListening, isSupported } = useVoiceInput({
    onResult: (text) => {
      onResult(text);
      stopListening();
    },
  });

  useEffect(() => {
    onListeningChange?.(isListening);
  }, [isListening, onListeningChange]);

  if (!isSupported) {
    return null;
  }

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Button
        type="button"
        variant={isListening ? 'destructive' : variant}
        size={size}
        onClick={handleClick}
        className={cn(
          'transition-all duration-300',
          isListening && 'animate-pulse ring-2 ring-destructive ring-offset-2'
        )}
      >
        {isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </Button>

      {/* Listening indicator */}
      {isListening && (
        <div className="absolute -top-2 -right-2 w-4 h-4">
          <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-destructive" />
        </div>
      )}

      {/* Transcript display */}
      {showTranscript && isListening && transcript && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg p-3 shadow-lg min-w-[200px] max-w-[300px]">
          <div className="flex items-center gap-2 mb-1">
            <Loader2 className="w-3 h-3 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Écoute en cours...</span>
          </div>
          <p className="text-sm font-medium">{transcript}</p>
        </div>
      )}
    </div>
  );
};

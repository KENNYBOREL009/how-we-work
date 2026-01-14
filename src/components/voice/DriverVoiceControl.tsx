import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, Check, X, Navigation, MapPin, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { toast } from 'sonner';

interface VoiceCommand {
  keywords: string[];
  action: string;
  description: string;
  handler: () => void;
}

interface DriverVoiceControlProps {
  onAcceptRide?: () => void;
  onRejectRide?: () => void;
  onArrived?: () => void;
  onStartTrip?: () => void;
  onEndTrip?: () => void;
  onCallClient?: () => void;
  onSetDestination?: (destination: string) => void;
  hasActiveRide?: boolean;
  hasPendingRequest?: boolean;
  className?: string;
}

export const DriverVoiceControl = ({
  onAcceptRide,
  onRejectRide,
  onArrived,
  onStartTrip,
  onEndTrip,
  onCallClient,
  onSetDestination,
  hasActiveRide = false,
  hasPendingRequest = false,
  className,
}: DriverVoiceControlProps) => {
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [commandExecuted, setCommandExecuted] = useState(false);

  // Define voice commands
  const commands: VoiceCommand[] = [
    {
      keywords: ['accepter', 'accepte', 'ok', 'oui', 'prendre'],
      action: 'accept',
      description: 'Accepter la course',
      handler: () => onAcceptRide?.(),
    },
    {
      keywords: ['refuser', 'refuse', 'non', 'annuler', 'rejeter'],
      action: 'reject',
      description: 'Refuser la course',
      handler: () => onRejectRide?.(),
    },
    {
      keywords: ['arrivé', 'arrive', 'sur place', 'là', 'présent'],
      action: 'arrived',
      description: 'Je suis arrivé',
      handler: () => onArrived?.(),
    },
    {
      keywords: ['démarrer', 'démarre', 'commencer', 'commence', 'go', 'partir'],
      action: 'start',
      description: 'Démarrer la course',
      handler: () => onStartTrip?.(),
    },
    {
      keywords: ['terminer', 'termine', 'fini', 'fin', 'arrivée', 'destination'],
      action: 'end',
      description: 'Terminer la course',
      handler: () => onEndTrip?.(),
    },
    {
      keywords: ['appeler', 'appelle', 'téléphone', 'contact'],
      action: 'call',
      description: 'Appeler le client',
      handler: () => onCallClient?.(),
    },
  ];

  const processCommand = useCallback((transcript: string) => {
    const lowerTranscript = transcript.toLowerCase().trim();
    setLastCommand(transcript);

    // Check for destination command
    if (lowerTranscript.includes('direction') || lowerTranscript.includes('destination') || lowerTranscript.includes('aller à')) {
      // Extract destination
      const destinationMatch = lowerTranscript.match(/(?:direction|destination|aller à)\s+(.+)/);
      if (destinationMatch && destinationMatch[1]) {
        const destination = destinationMatch[1].trim();
        onSetDestination?.(destination);
        setCommandExecuted(true);
        toast.success('Destination définie', { description: destination });
        return;
      }
    }

    // Check for other commands
    for (const command of commands) {
      if (command.keywords.some(keyword => lowerTranscript.includes(keyword))) {
        command.handler();
        setCommandExecuted(true);
        toast.success('Commande exécutée', { description: command.description });
        return;
      }
    }

    // No command recognized
    toast.error('Commande non reconnue', { 
      description: `"${transcript}" - Essayez: accepter, refuser, arrivé, démarrer, terminer` 
    });
  }, [commands, onSetDestination]);

  const { isListening, transcript, startListening, stopListening, isSupported } = useVoiceInput({
    onResult: processCommand,
    continuous: true,
  });

  useEffect(() => {
    if (commandExecuted) {
      const timer = setTimeout(() => {
        setCommandExecuted(false);
        setLastCommand(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [commandExecuted]);

  if (!isSupported) {
    return null;
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Contrôle Vocal</h3>
        </div>
        <Badge variant={isListening ? 'destructive' : 'secondary'}>
          {isListening ? 'Écoute...' : 'Inactif'}
        </Badge>
      </div>

      {/* Main voice button */}
      <Button
        size="lg"
        variant={isListening ? 'destructive' : 'default'}
        onClick={isListening ? stopListening : startListening}
        className={cn(
          'w-full h-20 text-lg font-bold transition-all',
          isListening && 'animate-pulse'
        )}
      >
        {isListening ? (
          <>
            <MicOff className="w-8 h-8 mr-3" />
            Arrêter l'écoute
          </>
        ) : (
          <>
            <Mic className="w-8 h-8 mr-3" />
            Activer la voix
          </>
        )}
      </Button>

      {/* Current transcript */}
      {isListening && transcript && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Vous dites :</p>
          <p className="font-medium">{transcript}</p>
        </div>
      )}

      {/* Last command executed */}
      {lastCommand && commandExecuted && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5 text-green-500" />
          <span className="text-sm text-green-700 dark:text-green-400">
            Commande exécutée : "{lastCommand}"
          </span>
        </div>
      )}

      {/* Available commands */}
      <div className="mt-4">
        <p className="text-xs text-muted-foreground mb-2">Commandes disponibles :</p>
        <div className="flex flex-wrap gap-1">
          {hasPendingRequest && (
            <>
              <Badge variant="outline" className="text-xs">
                <Check className="w-3 h-3 mr-1" />
                "Accepter"
              </Badge>
              <Badge variant="outline" className="text-xs">
                <X className="w-3 h-3 mr-1" />
                "Refuser"
              </Badge>
            </>
          )}
          {hasActiveRide && (
            <>
              <Badge variant="outline" className="text-xs">
                <Navigation className="w-3 h-3 mr-1" />
                "Arrivé"
              </Badge>
              <Badge variant="outline" className="text-xs">
                <MapPin className="w-3 h-3 mr-1" />
                "Terminer"
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Phone className="w-3 h-3 mr-1" />
                "Appeler"
              </Badge>
            </>
          )}
          <Badge variant="outline" className="text-xs">
            "Direction [lieu]"
          </Badge>
        </div>
      </div>
    </Card>
  );
};

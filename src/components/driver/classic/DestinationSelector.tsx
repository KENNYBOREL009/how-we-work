import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DOUALA_ZONES } from '@/types/driver-services';
import { MapPin, Mic, History, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RecentDestination {
  zoneId: string;
  zoneName: string;
  usedAt: string;
}

interface DestinationSelectorProps {
  currentDestination?: string;
  recentDestinations: RecentDestination[];
  onSelectDestination: (zoneId: string, zoneName: string) => void;
  onClearDestination: () => void;
}

export const DestinationSelector = ({
  currentDestination,
  recentDestinations,
  onSelectDestination,
  onClearDestination,
}: DestinationSelectorProps) => {
  const [isListening, setIsListening] = useState(false);
  const [showAllZones, setShowAllZones] = useState(false);

  const currentZone = DOUALA_ZONES.find(z => z.id === currentDestination);

  // Simulation reconnaissance vocale
  const startVoiceInput = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Reconnaissance vocale non disponible', {
        description: 'Votre navigateur ne supporte pas cette fonctionnalité',
      });
      return;
    }

    setIsListening(true);
    toast.info('Écoutez...', { description: 'Dites votre destination' });

    // Simulation - en prod, utiliser l'API Web Speech
    setTimeout(() => {
      setIsListening(false);
      // Simuler une reconnaissance
      const randomZone = DOUALA_ZONES[Math.floor(Math.random() * DOUALA_ZONES.length)];
      toast.success(`Destination reconnue : ${randomZone.name}`);
      onSelectDestination(randomZone.id, randomZone.name);
    }, 2000);
  };

  // Filtrer les zones récentes (max 3)
  const recentZoneIds = recentDestinations.slice(0, 3).map(r => r.zoneId);
  const recentZones = DOUALA_ZONES.filter(z => recentZoneIds.includes(z.id));
  const otherZones = DOUALA_ZONES.filter(z => !recentZoneIds.includes(z.id));

  return (
    <div className="space-y-4">
      {/* Destination actuelle */}
      {currentZone ? (
        <Card className="p-4 bg-primary/10 border-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-2xl">{currentZone.icon}</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Direction</p>
                <p className="text-xl font-bold">{currentZone.name}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearDestination}
              className="h-10 w-10 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Bouton vocal - gros et visible */}
          <Button
            onClick={startVoiceInput}
            disabled={isListening}
            className={cn(
              'w-full h-20 text-xl font-bold rounded-2xl transition-all',
              isListening
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-primary hover:bg-primary/90'
            )}
          >
            <Mic className={cn('w-8 h-8 mr-3', isListening && 'animate-bounce')} />
            {isListening ? 'Parlez maintenant...' : 'Dire ma destination'}
          </Button>

          {/* Destinations récentes */}
          {recentZones.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <History className="w-4 h-4" />
                <span>Récentes</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {recentZones.map((zone) => (
                  <Button
                    key={zone.id}
                    variant="outline"
                    onClick={() => onSelectDestination(zone.id, zone.name)}
                    className="h-16 flex-col gap-1 rounded-xl"
                  >
                    <span className="text-xl">{zone.icon}</span>
                    <span className="text-xs font-medium">{zone.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Toutes les zones */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>Zones</span>
              </div>
              {!showAllZones && otherZones.length > 4 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllZones(true)}
                  className="text-xs"
                >
                  Voir tout
                </Button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(showAllZones ? DOUALA_ZONES : DOUALA_ZONES.slice(0, 8)).map((zone) => (
                <Button
                  key={zone.id}
                  variant="outline"
                  onClick={() => onSelectDestination(zone.id, zone.name)}
                  className={cn(
                    'h-14 flex-col gap-0.5 rounded-xl text-xs p-1',
                    recentZoneIds.includes(zone.id) && 'border-primary/50 bg-primary/5'
                  )}
                >
                  <span className="text-lg">{zone.icon}</span>
                  <span className="font-medium truncate w-full text-center">{zone.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

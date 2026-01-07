import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { SeatCapacityWidget } from './SeatCapacityWidget';
import { DestinationSelector } from './DestinationSelector';
import { Power, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeatStatus {
  id: number;
  status: 'empty' | 'occupied' | 'reserved';
  clientName?: string;
}

interface ClassicDriverControlsProps {
  isOnline: boolean;
  onToggleOnline: () => void;
  currentDestination?: string;
  onSelectDestination: (zoneId: string, zoneName: string) => void;
  onClearDestination: () => void;
  seats: SeatStatus[];
  onSeatStatusChange: (seatId: number, status: 'empty' | 'occupied') => void;
}

export const ClassicDriverControls = ({
  isOnline,
  onToggleOnline,
  currentDestination,
  onSelectDestination,
  onClearDestination,
  seats,
  onSeatStatusChange,
}: ClassicDriverControlsProps) => {
  const [recentDestinations] = useState([
    { zoneId: 'akwa', zoneName: 'Akwa', usedAt: new Date().toISOString() },
    { zoneId: 'bonanjo', zoneName: 'Bonanjo', usedAt: new Date().toISOString() },
  ]);

  const emptySeats = seats.filter(s => s.status === 'empty').length;
  const occupiedSeats = seats.filter(s => s.status === 'occupied').length;

  // Fonction pour basculer rapidement le compteur de places
  const handleAddPassenger = () => {
    const emptySeat = seats.find(s => s.status === 'empty');
    if (emptySeat) {
      onSeatStatusChange(emptySeat.id, 'occupied');
    }
  };

  const handleRemovePassenger = () => {
    const occupiedSeat = [...seats].reverse().find(s => s.status === 'occupied');
    if (occupiedSeat) {
      onSeatStatusChange(occupiedSeat.id, 'empty');
    }
  };

  return (
    <div className="space-y-4">
      {/* Gros bouton ON/OFF */}
      <Card 
        className={cn(
          'p-4 transition-all duration-300',
          isOnline 
            ? 'bg-green-500/10 border-green-500' 
            : 'bg-red-500/10 border-red-500'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center transition-all',
                isOnline ? 'bg-green-500' : 'bg-red-500'
              )}
            >
              <Power className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {isOnline ? 'EN LIGNE' : 'HORS LIGNE'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isOnline ? 'Vous recevez les réservations' : 'Activez pour recevoir des clients'}
              </p>
            </div>
          </div>
          <Switch
            checked={isOnline}
            onCheckedChange={onToggleOnline}
            className="scale-150"
          />
        </div>
      </Card>

      {isOnline && (
        <>
          {/* Sélecteur de destination */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              🎯 Ma direction
            </h3>
            <DestinationSelector
              currentDestination={currentDestination}
              recentDestinations={recentDestinations}
              onSelectDestination={onSelectDestination}
              onClearDestination={onClearDestination}
            />
          </Card>

          {/* Compteur de places simplifié */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              🪑 Mes places
            </h3>
            
            {/* Contrôles +/- géants */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleRemovePassenger}
                disabled={occupiedSeats === 0}
                className="w-20 h-20 rounded-2xl text-3xl font-bold"
              >
                <Minus className="w-10 h-10" />
              </Button>
              
              <div className="text-center">
                <p className="text-5xl font-black text-primary">{emptySeats}</p>
                <p className="text-sm text-muted-foreground">places libres</p>
              </div>
              
              <Button
                variant="outline"
                size="lg"
                onClick={handleAddPassenger}
                disabled={emptySeats === 0}
                className="w-20 h-20 rounded-2xl text-3xl font-bold"
              >
                <Plus className="w-10 h-10" />
              </Button>
            </div>

            {/* Widget visuel des sièges */}
            <SeatCapacityWidget 
              seats={seats}
              onSeatClick={(seatId) => {
                const seat = seats.find(s => s.id === seatId);
                if (seat && seat.status !== 'reserved') {
                  onSeatStatusChange(
                    seatId, 
                    seat.status === 'empty' ? 'occupied' : 'empty'
                  );
                }
              }}
            />
          </Card>
        </>
      )}
    </div>
  );
};

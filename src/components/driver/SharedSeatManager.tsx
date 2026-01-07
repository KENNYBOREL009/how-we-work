import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Users, Plus, Minus, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SharedSeatManagerProps {
  maxSeats?: number;
  currentDestination?: string;
  farePerKm?: number;
  onSeatsChange?: (occupiedSeats: number) => void;
  onDestinationChange?: () => void;
}

export const SharedSeatManager = ({
  maxSeats = 4,
  currentDestination,
  farePerKm = 150,
  onSeatsChange,
  onDestinationChange,
}: SharedSeatManagerProps) => {
  const [occupiedSeats, setOccupiedSeats] = useState(0);
  
  const availableSeats = maxSeats - occupiedSeats;
  const isFull = availableSeats === 0;
  const isEmpty = occupiedSeats === 0;

  const handleAddPassenger = () => {
    if (occupiedSeats < maxSeats) {
      const newCount = occupiedSeats + 1;
      setOccupiedSeats(newCount);
      onSeatsChange?.(newCount);
    }
  };

  const handleRemovePassenger = () => {
    if (occupiedSeats > 0) {
      const newCount = occupiedSeats - 1;
      setOccupiedSeats(newCount);
      onSeatsChange?.(newCount);
    }
  };

  const getStatusColor = () => {
    if (isFull) return 'text-destructive';
    if (occupiedSeats > 0) return 'text-amber-500';
    return 'text-green-500';
  };

  const getStatusBadge = () => {
    if (isFull) return { label: 'Complet', variant: 'destructive' as const };
    if (occupiedSeats > 0) return { label: 'En course', variant: 'default' as const };
    return { label: 'Disponible', variant: 'secondary' as const };
  };

  const status = getStatusBadge();

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      {/* Header with destination */}
      <div className="p-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Direction</span>
          </div>
          <Badge variant={status.variant} className="text-xs">
            {status.label}
          </Badge>
        </div>
        
        {currentDestination ? (
          <button 
            onClick={onDestinationChange}
            className="mt-2 flex items-center gap-2 text-left w-full group"
          >
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground group-hover:text-primary transition-colors">
              {currentDestination}
            </span>
          </button>
        ) : (
          <button
            onClick={onDestinationChange}
            className="mt-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            + Définir une destination
          </button>
        )}
      </div>

      {/* Seats control */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Seat counter */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              "bg-gradient-to-br",
              isFull ? "from-destructive/20 to-destructive/10" :
              occupiedSeats > 0 ? "from-amber-500/20 to-amber-500/10" :
              "from-green-500/20 to-green-500/10"
            )}>
              <Users className={cn("w-6 h-6", getStatusColor())} />
            </div>
            
            <div>
              <div className="flex items-baseline gap-1">
                <span className={cn("text-3xl font-bold", getStatusColor())}>
                  {availableSeats}
                </span>
                <span className="text-sm text-muted-foreground">/ {maxSeats}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                places disponibles
              </span>
            </div>
          </div>

          {/* +/- Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={handleRemovePassenger}
              disabled={isEmpty}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={handleAddPassenger}
              disabled={isFull}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Fare info */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tarif par km</span>
          <span className="font-semibold text-primary">{farePerKm} FCFA</span>
        </div>

        {/* Visual seat indicator */}
        <div className="mt-3 flex justify-center gap-2">
          {Array.from({ length: maxSeats }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all",
                i < occupiedSeats 
                  ? "bg-primary border-primary text-primary-foreground" 
                  : "border-dashed border-muted-foreground/30"
              )}
            >
              {i < occupiedSeats && (
                <Users className="w-4 h-4" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

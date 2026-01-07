import { cn } from '@/lib/utils';
import { User, Smartphone } from 'lucide-react';

interface SeatStatus {
  id: number;
  status: 'empty' | 'occupied' | 'reserved';
  clientName?: string;
  clientAvatar?: string;
}

interface SeatCapacityWidgetProps {
  seats: SeatStatus[];
  onSeatClick?: (seatId: number) => void;
  compact?: boolean;
}

export const SeatCapacityWidget = ({
  seats,
  onSeatClick,
  compact = false,
}: SeatCapacityWidgetProps) => {
  const getStatusColor = (status: SeatStatus['status']) => {
    switch (status) {
      case 'empty':
        return 'bg-green-500 border-green-600';
      case 'occupied':
        return 'bg-gray-400 border-gray-500';
      case 'reserved':
        return 'bg-amber-400 border-amber-500 animate-pulse';
      default:
        return 'bg-gray-300 border-gray-400';
    }
  };

  const getStatusLabel = (status: SeatStatus['status']) => {
    switch (status) {
      case 'empty':
        return 'Libre';
      case 'occupied':
        return 'Occupée';
      case 'reserved':
        return 'Réservée';
      default:
        return '';
    }
  };

  const emptyCount = seats.filter(s => s.status === 'empty').length;
  const reservedCount = seats.filter(s => s.status === 'reserved').length;

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md border">
        {seats.map((seat) => (
          <div
            key={seat.id}
            className={cn(
              'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
              getStatusColor(seat.status)
            )}
          >
            {seat.status === 'reserved' && (
              <Smartphone className="w-3 h-3 text-white" />
            )}
            {seat.status === 'occupied' && (
              <User className="w-3 h-3 text-white" />
            )}
          </div>
        ))}
        <span className="text-xs font-medium ml-1">
          {emptyCount} libre{emptyCount > 1 ? 's' : ''}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-4 border shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Places disponibles</h3>
        <span className="text-2xl font-bold text-primary">{emptyCount}/{seats.length}</span>
      </div>

      <div className="flex justify-center gap-3 mb-4">
        {seats.map((seat) => (
          <button
            key={seat.id}
            onClick={() => onSeatClick?.(seat.id)}
            className={cn(
              'w-14 h-14 rounded-xl border-3 flex flex-col items-center justify-center transition-all',
              'hover:scale-105 active:scale-95',
              getStatusColor(seat.status)
            )}
          >
            {seat.status === 'reserved' ? (
              <>
                <Smartphone className="w-5 h-5 text-white mb-0.5" />
                <span className="text-[10px] text-white font-medium">Appli</span>
              </>
            ) : seat.status === 'occupied' ? (
              <>
                <User className="w-5 h-5 text-white mb-0.5" />
                <span className="text-[10px] text-white font-medium">Client</span>
              </>
            ) : (
              <>
                <span className="text-lg font-bold text-white">{seat.id}</span>
                <span className="text-[10px] text-white/80">Libre</span>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Légende */}
      <div className="flex justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Libre</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gray-400" />
          <span>Occupée</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <span>Réservée</span>
        </div>
      </div>

      {reservedCount > 0 && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
            {reservedCount} place{reservedCount > 1 ? 's' : ''} réservée{reservedCount > 1 ? 's' : ''} via l'application
          </p>
        </div>
      )}
    </div>
  );
};

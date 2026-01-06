import { Vehicle } from '@/hooks/useVehicles';
import { Bus, MapPin, Users, Building2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface BusListProps {
  vehicles: Vehicle[];
  isLoading: boolean;
  onVehicleClick?: (vehicle: Vehicle) => void;
}

const statusConfig = {
  available: {
    label: 'En service',
    color: 'bg-lokebo-success',
    textColor: 'text-lokebo-success',
  },
  full: {
    label: 'Complet',
    color: 'bg-lokebo-warning',
    textColor: 'text-lokebo-warning',
  },
  offline: {
    label: 'Hors service',
    color: 'bg-muted-foreground',
    textColor: 'text-muted-foreground',
  },
};

const BusList = ({ vehicles, isLoading, onVehicleClick }: BusListProps) => {
  // Filtrer uniquement les bus
  const buses = vehicles.filter((v) => v.vehicle_type === 'bus');

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-xl bg-muted">
            <div className="w-10 h-10 rounded-lg bg-muted-foreground/20" />
            <div className="flex-1">
              <div className="h-4 bg-muted-foreground/20 rounded w-1/2 mb-2" />
              <div className="h-3 bg-muted-foreground/20 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {buses.length > 0 ? (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
              <Bus className="w-4 h-4" />
              Bus en circulation ({buses.length})
            </h4>
            <div className="space-y-2">
              {buses.map((vehicle) => (
                <BusCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onClick={() => onVehicleClick?.(vehicle)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Bus className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">Aucun bus disponible</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

const BusCard = ({
  vehicle,
  onClick,
}: {
  vehicle: Vehicle;
  onClick?: () => void;
}) => {
  const status = statusConfig[vehicle.status as keyof typeof statusConfig] || statusConfig.offline;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors text-left"
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-lokebo-dark">
        <Bus className="w-5 h-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground text-sm truncate">
            {vehicle.plate_number}
          </span>
          <span className={cn('w-2 h-2 rounded-full', status.color)} />
        </div>

        <div className="flex items-center gap-3 mt-0.5">
          {vehicle.operator && (
            <span className="text-xs text-primary font-medium flex items-center gap-1">
              <Building2 className="w-3 h-3 shrink-0" />
              {vehicle.operator}
            </span>
          )}
          {vehicle.destination && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              {vehicle.destination}
            </span>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" />
            {vehicle.capacity}
          </span>
        </div>
      </div>

      <span
        className={cn(
          'text-xs font-medium px-2 py-1 rounded-full',
          status.textColor,
          'bg-current/10'
        )}
        style={{ backgroundColor: `color-mix(in srgb, currentColor 10%, transparent)` }}
      >
        {status.label}
      </span>
    </button>
  );
};

export default BusList;

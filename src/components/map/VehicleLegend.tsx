import React from 'react';
import { cn } from '@/lib/utils';
import { DESTINATION_COLORS } from './VehicleMarker';

interface VehicleLegendProps {
  className?: string;
  compact?: boolean;
}

const VehicleLegend: React.FC<VehicleLegendProps> = ({ className, compact = false }) => {
  // Destinations principales avec leurs couleurs
  const destinationLegends = [
    { destination: 'Bonanjo', color: DESTINATION_COLORS['Bonanjo'] },
    { destination: 'Akwa', color: DESTINATION_COLORS['Akwa'] },
    { destination: 'Deido', color: DESTINATION_COLORS['Deido'] },
    { destination: 'Bonapriso', color: DESTINATION_COLORS['Bonapriso'] },
    { destination: 'Makepe', color: DESTINATION_COLORS['Makepe'] },
    { destination: 'Bonaberi', color: DESTINATION_COLORS['Bonaberi'] },
  ];

  const vehicleTypes = [
    {
      color: '#FFD42F',
      label: 'Taxi Collectif',
      icon: '🚕',
      description: 'Taxi jaune standard'
    },
    {
      color: '#8b5cf6',
      label: 'Confort Partagé',
      icon: '👥',
      description: 'VTC partagé premium'
    }
  ];

  const statusLegends = [
    { color: '#22c55e', label: 'Libre' },
    { color: '#f59e0b', label: 'Partiel' },
    { color: '#ef4444', label: 'Complet' },
  ];

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-3 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-border",
        className
      )}>
        {vehicleTypes.map((type) => (
          <div key={type.label} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: type.color }}
            />
            <span className="text-xs font-medium">{type.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-background/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-border space-y-4",
      className
    )}>
      {/* Types de véhicules */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Types de véhicules
        </p>
        <div className="space-y-2">
          {vehicleTypes.map((type) => (
            <div key={type.label} className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-md"
                style={{ 
                  background: `linear-gradient(135deg, ${type.color}, ${type.color}cc)` 
                }}
              >
                <span className="text-xs">{type.icon}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{type.label}</p>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Couleurs par destination */}
      <div className="pt-3 border-t border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Couleurs par destination
        </p>
        <div className="grid grid-cols-2 gap-2">
          {destinationLegends.map((item) => (
            <div key={item.destination} className="flex items-center gap-2">
              <div
                className="w-4 h-6 rounded-sm shadow-sm"
                style={{ 
                  backgroundColor: item.color,
                  clipPath: 'polygon(20% 0%, 80% 0%, 100% 15%, 100% 100%, 0% 100%, 0% 15%)'
                }}
              />
              <span className="text-xs font-medium">{item.destination}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Statut des places */}
      <div className="pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">Statut des places</p>
        <div className="flex items-center gap-4">
          {statusLegends.map((status) => (
            <div key={status.label} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              <span className="text-xs">{status.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VehicleLegend;

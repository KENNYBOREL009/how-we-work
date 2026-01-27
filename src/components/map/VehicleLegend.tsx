import React from 'react';
import { cn } from '@/lib/utils';

interface VehicleLegendProps {
  className?: string;
  compact?: boolean;
}

const VehicleLegend: React.FC<VehicleLegendProps> = ({ className, compact = false }) => {
  const legends = [
    {
      color: '#FFD42F',
      label: 'Taxi Jaune',
      icon: '🚕',
      description: 'Taxi collectif standard'
    },
    {
      color: '#8b5cf6',
      label: 'Confort Partagé',
      icon: '👥',
      description: 'VTC partagé - Rejoignez une course'
    }
  ];

  const statusLegends = [
    { color: '#22c55e', label: 'Disponible' },
    { color: '#f59e0b', label: 'Partiel' },
    { color: '#ef4444', label: 'Complet' },
  ];

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-3 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-border",
        className
      )}>
        {legends.map((legend) => (
          <div key={legend.label} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: legend.color }}
            />
            <span className="text-xs font-medium">{legend.label}</span>
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
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Véhicules sur la carte
      </p>
      
      {/* Vehicle types */}
      <div className="space-y-3">
        {legends.map((legend) => (
          <div key={legend.label} className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-md"
              style={{ 
                background: `linear-gradient(135deg, ${legend.color}, ${legend.color}cc)` 
              }}
            >
              <span className="text-sm">{legend.icon}</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{legend.label}</p>
              <p className="text-xs text-muted-foreground">{legend.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status indicators */}
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

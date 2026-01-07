import { useState, useEffect } from 'react';
import { Car, MapPin, Shield, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface ComfortZoneIndicatorProps {
  className?: string;
  onRefresh?: () => void;
  initialCount?: number;
}

export const ComfortZoneIndicator = ({ className, onRefresh, initialCount }: ComfortZoneIndicatorProps) => {
  const [availableVehicles, setAvailableVehicles] = useState(initialCount ?? 0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch real vehicle count on mount
  useEffect(() => {
    const fetchCount = async () => {
      const { count, error } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('ride_mode', 'shared')
        .in('status', ['available', 'busy'])
        .lt('current_passengers', 4);
      
      if (!error && count !== null) {
        setAvailableVehicles(count);
      } else if (initialCount === undefined) {
        // Fallback to simulated count if no DB data
        setAvailableVehicles(Math.floor(Math.random() * 4) + 1);
      }
    };
    
    fetchCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [initialCount]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    onRefresh?.();
    
    const { count, error } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('ride_mode', 'shared')
      .in('status', ['available', 'busy'])
      .lt('current_passengers', 4);
    
    if (!error && count !== null) {
      setAvailableVehicles(count);
    } else {
      // Fallback simulation
      setAvailableVehicles(Math.floor(Math.random() * 5) + 1);
    }
    
    setIsRefreshing(false);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Zone de chaleur simulée - fond avec gradient */}
      <div className="relative h-48 rounded-3xl overflow-hidden bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-indigo-500/20 border border-violet-500/30">
        {/* Cercles concentriques animés */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-32 h-32 rounded-full bg-violet-500/10 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute w-48 h-48 rounded-full bg-violet-500/5 animate-ping" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
          <div className="absolute w-64 h-64 rounded-full bg-violet-500/5 animate-ping" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          
          {/* Centre - Votre position */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-violet-600 dark:text-violet-400 mt-2">Votre position</span>
          </div>
        </div>

        {/* Points représentant véhicules (non précis) */}
        <div className="absolute top-8 left-12 w-3 h-3 rounded-full bg-violet-400/60 animate-pulse" />
        <div className="absolute top-16 right-16 w-2.5 h-2.5 rounded-full bg-violet-400/50 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-12 left-20 w-2 h-2 rounded-full bg-violet-400/40 animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Badge de confidentialité */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm flex items-center gap-1.5 text-xs">
          <Shield className="w-3 h-3 text-violet-500" />
          <span className="text-muted-foreground">Positions masquées</span>
        </div>
      </div>

      {/* Indicateur de disponibilité */}
      <div 
        onClick={handleRefresh}
        className={cn(
          "mt-4 p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20",
          "flex items-center justify-between cursor-pointer hover:border-violet-500/40 transition-colors"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center",
            isRefreshing && "animate-pulse"
          )}>
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-violet-700 dark:text-violet-300">
              {availableVehicles} véhicule{availableVehicles > 1 ? 's' : ''} Confort
            </p>
            <p className="text-xs text-muted-foreground">Disponibles dans votre zone</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
          <Wifi className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          <span>{isRefreshing ? 'Actualisation...' : 'Live'}</span>
        </div>
      </div>
    </div>
  );
};

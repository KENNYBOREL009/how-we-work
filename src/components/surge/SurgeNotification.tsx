import { useState, useEffect } from "react";
import { Flame, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSurgePricing } from "@/hooks/useSurgePricing";

interface SurgeNotificationProps {
  isDriver?: boolean;
  onNavigateToZone?: (lat: number, lng: number, zoneName: string) => void;
}

export const SurgeNotification = ({ 
  isDriver = false,
  onNavigateToZone 
}: SurgeNotificationProps) => {
  const { highDemandZones } = useSurgePricing();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [visible, setVisible] = useState(true);

  // Auto-dismiss after 30 seconds
  useEffect(() => {
    if (highDemandZones.length > 0) {
      const timer = setTimeout(() => setVisible(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [highDemandZones]);

  const activeZones = highDemandZones.filter(z => !dismissed.includes(z.id));

  if (!visible || activeZones.length === 0) return null;

  const topZone = activeZones[0];

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-in-bottom">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-4 shadow-lg text-white">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              {isDriver ? (
                <>
                  <p className="font-bold">💰 Prix élevés à {topZone.zoneName}</p>
                  <p className="text-sm text-white/80">
                    ×{topZone.surgeMultiplier} - {topZone.demandCount} demandes actives
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold">Forte demande dans la zone</p>
                  <p className="text-sm text-white/80">
                    Prix majoré de {Math.round((topZone.surgeMultiplier - 1) * 100)}%
                  </p>
                </>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => setDismissed([...dismissed, topZone.id])}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {isDriver && onNavigateToZone && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full mt-3"
            onClick={() => onNavigateToZone(topZone.centerLat, topZone.centerLng, topZone.zoneName)}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Aller vers cette zone
          </Button>
        )}

        {activeZones.length > 1 && (
          <p className="text-xs text-white/60 mt-2 text-center">
            +{activeZones.length - 1} autre(s) zone(s) en forte demande
          </p>
        )}
      </div>
    </div>
  );
};

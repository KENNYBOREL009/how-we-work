import { Clock, MapPin } from 'lucide-react';
import { RouteSchedule } from '@/hooks/useBusSchedule';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SchedulePanelProps {
  schedules: RouteSchedule[];
  isLoading: boolean;
}

const SchedulePanel = ({ schedules, isLoading }: SchedulePanelProps) => {
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-2" />
            <div className="h-3 bg-muted rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Aucun horaire disponible</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {schedules.map((route) => (
          <div
            key={route.routeId}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <span
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: route.color }}
              />
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  {route.routeName}
                </h3>
                {route.routeDescription && (
                  <p className="text-xs text-muted-foreground">
                    {route.routeDescription}
                  </p>
                )}
              </div>
            </div>

            {route.stops.length > 0 ? (
              <div className="relative pl-6">
                {/* Vertical line */}
                <div
                  className="absolute left-[7px] top-2 bottom-2 w-0.5"
                  style={{ backgroundColor: route.color }}
                />

                {route.stops.map((stop, idx) => (
                  <div key={stop.id} className="relative pb-4 last:pb-0">
                    {/* Stop dot */}
                    <div
                      className="absolute left-[-18px] top-1 w-3 h-3 rounded-full border-2 border-card"
                      style={{ backgroundColor: route.color }}
                    />

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {stop.stopName}
                        </p>
                        {stop.stopAddress && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {stop.stopAddress}
                          </p>
                        )}
                      </div>
                      {stop.arrivalTime && (
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          {stop.arrivalTime.slice(0, 5)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Aucun arrêt configuré
              </p>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default SchedulePanel;

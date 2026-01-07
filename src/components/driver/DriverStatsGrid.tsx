import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Car, TrendingUp, ChevronRight } from "lucide-react";
import type { DriverStats } from "@/types";

interface DriverStatsGridProps {
  stats: DriverStats;
  onWeeklyClick?: () => void;
}

export const DriverStatsGrid = ({ stats, onWeeklyClick }: DriverStatsGridProps) => {
  return (
    <div className="space-y-4">
      {/* Today's summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Aujourd'hui</h3>
            <Badge variant="secondary">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long' })}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-500/10 rounded-xl">
              <Wallet className="w-6 h-6 mx-auto mb-1 text-green-600" />
              <p className="text-2xl font-bold text-green-600">
                {stats.todayEarnings.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">FCFA gagnés</p>
            </div>
            <div className="text-center p-3 bg-primary/10 rounded-xl">
              <Car className="w-6 h-6 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold text-primary">{stats.todayTrips}</p>
              <p className="text-xs text-muted-foreground">courses</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly stats */}
      <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={onWeeklyClick}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="font-semibold">Cette semaine</p>
                <p className="text-sm text-muted-foreground">
                  {stats.weekEarnings.toLocaleString()} FCFA
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

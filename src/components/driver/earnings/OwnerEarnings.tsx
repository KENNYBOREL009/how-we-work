import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText, TrendingUp, TrendingDown, Wallet, Car } from 'lucide-react';
import { QuickExpenseButton } from '../QuickExpenseButton';

interface OwnerEarningsProps {
  todayEarnings: number;
  todayTrips: number;
  todayExpenses: number;
  weeklyData?: { day: string; earnings: number; expenses: number }[];
  fleetVehicleId?: string | null;
}

export const OwnerEarnings = ({
  todayEarnings,
  todayTrips,
  todayExpenses,
  weeklyData,
  fleetVehicleId,
}: OwnerEarningsProps) => {
  const netProfit = todayEarnings - todayExpenses;

  return (
    <div className="space-y-4">
      {/* Résumé du jour */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-sm text-muted-foreground">Revenus bruts</p>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {todayEarnings.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {todayTrips} courses aujourd'hui
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <p className="text-sm text-muted-foreground">Dépenses</p>
            </div>
            <p className="text-2xl font-bold text-red-600">
              -{todayExpenses.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Carburant, entretien...
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Bénéfice net */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-primary" />
            <p className="text-sm text-muted-foreground">Bénéfice net</p>
          </div>
          <p className={`text-4xl font-bold text-center ${netProfit >= 0 ? 'text-primary' : 'text-red-600'}`}>
            {netProfit.toLocaleString()} FCFA
          </p>
          {netProfit > 0 && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              100% pour vous 🎉
            </p>
          )}
        </CardContent>
      </Card>

      {/* Graphique semaine (simplifié) */}
      {weeklyData && weeklyData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">7 derniers jours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-24 gap-1">
              {weeklyData.map((day, i) => {
                const maxEarning = Math.max(...weeklyData.map(d => d.earnings));
                const height = maxEarning > 0 ? (day.earnings / maxEarning) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className="w-full bg-primary/80 rounded-t transition-all"
                      style={{ height: `${height}%`, minHeight: day.earnings > 0 ? '4px' : '0' }}
                    />
                    <span className="text-[10px] text-muted-foreground">{day.day}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bouton ajout dépense */}
      <QuickExpenseButton fleetVehicleId={fleetVehicleId || undefined} />
    </div>
  );
};

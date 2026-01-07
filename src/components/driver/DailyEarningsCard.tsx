import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Fuel, Percent, Wallet, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DailyEarningsSummary } from '@/types/driver';
import type { DriverOperatingMode } from '@/types/driver';

interface DailyEarningsCardProps {
  summary: DailyEarningsSummary | null;
  operatingMode: DriverOperatingMode | null;
  dailyTarget?: number;
  commissionRate?: number;
  rentAmount?: number;
}

export const DailyEarningsCard = ({
  summary,
  operatingMode,
  dailyTarget = 30000,
  commissionRate = 20,
  rentAmount = 15000,
}: DailyEarningsCardProps) => {
  const grossEarnings = summary?.grossEarnings || 0;
  const expenses = summary?.totalExpenses || 0;
  const tripCount = summary?.tripCount || 0;
  const distanceKm = summary?.distanceKm || 0;

  // Calculs selon le mode
  let deductions = 0;
  let netEarnings = grossEarnings - expenses;

  if (operatingMode === 'fleet_assigned') {
    deductions = Math.round(grossEarnings * (commissionRate / 100));
    netEarnings = grossEarnings - expenses - deductions;
  } else if (operatingMode === 'independent_tenant') {
    deductions = rentAmount;
    netEarnings = grossEarnings - expenses - deductions;
  }

  const progressPercent = Math.min((grossEarnings / dailyTarget) * 100, 100);
  const isPositive = netEarnings > 0;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' FCFA';
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Gains du jour</CardTitle>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Car className="w-4 h-4" />
            <span>{tripCount} courses</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Montant principal */}
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground">Recettes brutes</p>
          <p className="text-3xl font-bold">{formatCurrency(grossEarnings)}</p>
        </div>

        {/* Barre de progression vers l'objectif */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Objectif journalier</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-right text-muted-foreground">
            {formatCurrency(dailyTarget)}
          </p>
        </div>

        {/* Détail des déductions */}
        <div className="space-y-2 pt-2 border-t">
          {/* Dépenses */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Fuel className="w-4 h-4 text-orange-500" />
              <span>Dépenses</span>
            </div>
            <span className="text-red-500">-{formatCurrency(expenses)}</span>
          </div>

          {/* Commission (mode flotte) */}
          {operatingMode === 'fleet_assigned' && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-blue-500" />
                <span>Commission ({commissionRate}%)</span>
              </div>
              <span className="text-red-500">-{formatCurrency(deductions)}</span>
            </div>
          )}

          {/* Location (mode locataire) */}
          {operatingMode === 'independent_tenant' && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-purple-500" />
                <span>Location véhicule</span>
              </div>
              <span className="text-red-500">-{formatCurrency(deductions)}</span>
            </div>
          )}
        </div>

        {/* Net */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPositive ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              <span className="font-medium">Net du jour</span>
            </div>
            <span
              className={cn(
                'text-xl font-bold',
                isPositive ? 'text-green-500' : 'text-red-500'
              )}
            >
              {formatCurrency(netEarnings)}
            </span>
          </div>
        </div>

        {/* Distance */}
        {distanceKm > 0 && (
          <p className="text-xs text-center text-muted-foreground pt-2">
            {distanceKm.toFixed(1)} km parcourus aujourd'hui
          </p>
        )}
      </CardContent>
    </Card>
  );
};

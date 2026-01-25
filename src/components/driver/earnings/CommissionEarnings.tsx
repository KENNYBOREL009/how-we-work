import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Percent, TrendingUp, Car, Info } from 'lucide-react';

interface CommissionEarningsProps {
  commissionRate: number;
  todayEarnings: number;
  todayTrips: number;
  ownerName?: string | null;
}

export const CommissionEarnings = ({
  commissionRate,
  todayEarnings,
  todayTrips,
  ownerName,
}: CommissionEarningsProps) => {
  const commissionAmount = Math.round(todayEarnings * (commissionRate / 100));
  const netEarnings = todayEarnings - commissionAmount;

  return (
    <div className="space-y-4">
      {/* Info commission */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Percent className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Modèle commission</p>
              <p className="text-sm text-muted-foreground">
                {ownerName || 'Propriétaire'} reçoit {commissionRate}%
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {commissionRate}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Gains du jour */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="w-4 h-4" />
            Aujourd'hui
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 p-4 rounded-xl text-center">
              <p className="text-sm text-muted-foreground">Courses</p>
              <p className="text-3xl font-bold">{todayTrips}</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-xl text-center">
              <p className="text-sm text-muted-foreground">Total brut</p>
              <p className="text-3xl font-bold">
                {todayEarnings.toLocaleString()}
              </p>
            </div>
          </div>

          <Separator />

          {/* Répartition */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">Votre part ({100 - commissionRate}%)</span>
              </div>
              <span className="font-bold text-green-600 text-lg">
                +{netEarnings.toLocaleString()} FCFA
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm">Commission ({commissionRate}%)</span>
              </div>
              <span className="font-medium text-red-600">
                -{commissionAmount.toLocaleString()} FCFA
              </span>
            </div>
          </div>

          {/* Barre de visualisation */}
          <div className="h-4 rounded-full overflow-hidden flex">
            <div 
              className="bg-green-500 h-full"
              style={{ width: `${100 - commissionRate}%` }}
            />
            <div 
              className="bg-red-500 h-full"
              style={{ width: `${commissionRate}%` }}
            />
          </div>

          <Separator />

          {/* Net */}
          <div className="bg-green-500/10 p-4 rounded-xl">
            <p className="text-sm text-muted-foreground text-center mb-1">Vos gains nets</p>
            <p className="text-4xl font-bold text-green-600 text-center">
              {netEarnings.toLocaleString()} FCFA
            </p>
          </div>

          {/* Note */}
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
            <p className="text-xs text-muted-foreground">
              La commission est reversée automatiquement à la fin de chaque journée. 
              Aucune action requise de votre part.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

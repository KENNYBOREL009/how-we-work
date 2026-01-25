import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Wallet, Check, Clock, TrendingUp, Car } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface DailyRentalEarningsProps {
  dailyRentalAmount: number;
  todayEarnings: number;
  todayTrips: number;
  isPaid?: boolean;
  ownerName?: string | null;
}

export const DailyRentalEarnings = ({
  dailyRentalAmount,
  todayEarnings,
  todayTrips,
  isPaid = false,
  ownerName,
}: DailyRentalEarningsProps) => {
  const [paid, setPaid] = useState(isPaid);
  const netEarnings = todayEarnings - dailyRentalAmount;

  const handlePayRental = () => {
    setPaid(true);
    toast.success('Location payée !', {
      description: `${dailyRentalAmount.toLocaleString()} FCFA envoyé à ${ownerName || 'votre propriétaire'}`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Status de paiement */}
      <Card className={paid ? 'border-green-500/50 bg-green-500/5' : 'border-orange-500/50 bg-orange-500/5'}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {paid ? (
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
              )}
              <div>
                <p className="font-medium">Location quotidienne</p>
                <p className="text-sm text-muted-foreground">
                  {ownerName || 'Propriétaire'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">{dailyRentalAmount.toLocaleString()} FCFA</p>
              {paid ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                  ✅ Payé
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                  En attente
                </Badge>
              )}
            </div>
          </div>
          
          {!paid && (
            <Button 
              className="w-full mt-4" 
              onClick={handlePayRental}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Payer la location
            </Button>
          )}
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
            <div className="bg-green-500/10 p-4 rounded-xl text-center">
              <p className="text-sm text-muted-foreground">Revenus bruts</p>
              <p className="text-3xl font-bold text-green-600">
                {todayEarnings.toLocaleString()}
              </p>
            </div>
          </div>

          <Separator />

          {/* Calcul net */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Revenus bruts</span>
              <span className="font-medium">+{todayEarnings.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between text-sm text-red-600">
              <span>Location quotidienne</span>
              <span className="font-medium">-{dailyRentalAmount.toLocaleString()} FCFA</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="font-semibold">Bénéfice net</span>
              <span className={`text-xl font-bold ${netEarnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netEarnings.toLocaleString()} FCFA
              </span>
            </div>
          </div>

          {netEarnings > 0 && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-700">
                Objectif atteint ! Tout ce que vous gagnez maintenant est pour vous.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

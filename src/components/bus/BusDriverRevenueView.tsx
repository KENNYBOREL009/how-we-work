import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  QrCode, 
  Hash, 
  Smartphone, 
  Banknote, 
  Armchair, 
  TrendingUp,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BusRevenueEntry } from '@/hooks/useMockTrafficData';

interface BusDriverRevenueViewProps {
  entries: BusRevenueEntry[];
  totalRevenue: number;
  cashRevenue: number;
  digitalRevenue: number;
  tripCount: number;
}

const typeConfig: Record<string, { icon: typeof QrCode; label: string; color: string }> = {
  cash: { icon: Banknote, label: 'Espèces', color: 'text-green-600' },
  wallet: { icon: Wallet, label: 'Wallet', color: 'text-blue-600' },
  qr_code: { icon: QrCode, label: 'QR Code', color: 'text-purple-600' },
  code: { icon: Hash, label: 'Code', color: 'text-amber-600' },
  reservation: { icon: Armchair, label: 'Réservation', color: 'text-pink-600' },
  in_app: { icon: Smartphone, label: 'In-App', color: 'text-cyan-600' },
};

const BusDriverRevenueView: React.FC<BusDriverRevenueViewProps> = ({
  entries,
  totalRevenue,
  cashRevenue,
  digitalRevenue,
  tripCount,
}) => {
  // Group by type for summary
  const byType = entries.reduce<Record<string, { count: number; amount: number }>>((acc, e) => {
    if (!acc[e.type]) acc[e.type] = { count: 0, amount: 0 };
    acc[e.type].count += e.ticketCount;
    acc[e.type].amount += e.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {/* Revenue summary */}
      <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Recettes du jour</p>
          <p className="text-3xl font-black text-green-600">
            {totalRevenue.toLocaleString()} <span className="text-base">FCFA</span>
          </p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="text-center p-2 bg-background/50 rounded-lg">
              <p className="text-sm font-bold text-green-600">{cashRevenue.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Espèces</p>
            </div>
            <div className="text-center p-2 bg-background/50 rounded-lg">
              <p className="text-sm font-bold text-blue-600">{digitalRevenue.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Digital</p>
            </div>
            <div className="text-center p-2 bg-background/50 rounded-lg">
              <p className="text-sm font-bold">{tripCount}</p>
              <p className="text-[10px] text-muted-foreground">Trajets</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue by payment type */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Répartition par mode
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          {Object.entries(byType).map(([type, data]) => {
            const config = typeConfig[type] || typeConfig.cash;
            const Icon = config.icon;
            const percent = totalRevenue > 0 ? Math.round((data.amount / totalRevenue) * 100) : 0;
            return (
              <div key={type} className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center bg-muted", config.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{config.label}</span>
                    <span className="font-bold">{data.amount.toLocaleString()} F</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full mt-1">
                    <div
                      className={cn("h-full rounded-full bg-primary transition-all")}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {data.count} tickets
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Transaction feed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            Dernières entrées
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-1.5">
          {entries.slice().reverse().map((entry) => {
            const config = typeConfig[entry.type] || typeConfig.cash;
            const Icon = config.icon;
            return (
              <div key={entry.id} className="flex items-center justify-between p-2.5 bg-muted rounded-lg">
                <div className="flex items-center gap-2.5">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center bg-background", config.color)}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{entry.passengerName || 'Anonyme'}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {entry.stopName} • {entry.time}
                      {entry.paymentCode && ` • ${entry.paymentCode}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">+{entry.amount} F</p>
                  <p className="text-[10px] text-muted-foreground">{entry.ticketCount} ticket{entry.ticketCount > 1 ? 's' : ''}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default BusDriverRevenueView;

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Lock, TrendingUp, AlertCircle, Coins, Calendar, BarChart3 } from 'lucide-react';
import type { AdminFinancialStats } from '@/hooks/useAdminExtended';

interface AdminFinanceCardProps {
  stats: AdminFinancialStats | null;
}

const AdminFinanceCard = ({ stats }: AdminFinanceCardProps) => {
  const formatCFA = (amount: number) => `${amount.toLocaleString()} FCFA`;

  const metrics = [
    {
      label: 'Balance totale wallets',
      value: stats?.total_wallet_balance ?? 0,
      icon: Wallet,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Montant bloqué',
      value: stats?.total_locked_amount ?? 0,
      icon: Lock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Revenus semaine',
      value: stats?.revenue_this_week ?? 0,
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Revenus mois',
      value: stats?.revenue_this_month ?? 0,
      icon: Calendar,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Tarif moyen course',
      value: stats?.avg_trip_fare ?? 0,
      icon: BarChart3,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      label: 'Pénalités collectées',
      value: stats?.total_penalties_collected ?? 0,
      icon: Coins,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-4 w-4" />
          Aperçu financier
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="space-y-1">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`h-3.5 w-3.5 ${metric.color}`} />
                </div>
                <span className="text-xs text-muted-foreground">{metric.label}</span>
              </div>
              <p className="text-lg font-bold">{formatCFA(metric.value)}</p>
            </div>
          ))}
        </div>

        {stats && stats.active_holds_count > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {stats.active_holds_count} blocages actifs ({formatCFA(stats.active_holds_amount)})
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminFinanceCard;

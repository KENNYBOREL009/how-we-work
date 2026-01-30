import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, MapPin, Wallet, Building2, Clock, Activity, TrendingUp } from 'lucide-react';
import type { AdminStats } from '@/hooks/useAdmin';

interface AdminStatsCardsProps {
  stats: AdminStats | null;
  isLoading?: boolean;
}

const AdminStatsCards = ({ stats, isLoading }: AdminStatsCardsProps) => {
  const statCards = [
    {
      title: 'Utilisateurs',
      value: stats?.total_users ?? 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Véhicules actifs',
      value: stats?.active_vehicles ?? 0,
      icon: Car,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Chauffeurs',
      value: stats?.total_drivers ?? 0,
      icon: Activity,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: "Courses aujourd'hui",
      value: stats?.trips_today ?? 0,
      icon: MapPin,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: "Revenus du jour",
      value: `${(stats?.revenue_today ?? 0).toLocaleString()} FCFA`,
      icon: Wallet,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Courses en cours',
      value: stats?.active_trips ?? 0,
      icon: TrendingUp,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'Propriétaires flotte',
      value: stats?.total_fleet_owners ?? 0,
      icon: Building2,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      title: 'Réservations en attente',
      value: stats?.pending_reservations ?? 0,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-8 bg-muted rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              </div>
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <p className="text-xl font-bold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminStatsCards;

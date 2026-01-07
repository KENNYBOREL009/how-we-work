import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useDriverDailyReports } from '@/hooks/useDriverDailyReports';
import { useDriverReliability } from '@/hooks/useDriverReliability';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, subDays, startOfWeek, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Clock,
  Fuel,
  MapPin,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const DriverAnalytics = () => {
  const navigate = useNavigate();
  const { reports } = useDriverDailyReports();
  const { getReliabilityScore } = useDriverReliability();
  const [reliabilityScore, setReliabilityScore] = useState<{ reliability_score: number } | null>(null);

  // Charger le score de fiabilité
  useState(() => {
    getReliabilityScore().then((score) => {
      if (score) {
        setReliabilityScore({ reliability_score: score.reliabilityScore });
      }
    });
  });

  // Données pour le graphique des 7 derniers jours
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const earningsData = last7Days.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const report = reports.find((r) => r.report_date === dayStr);
    return {
      day: format(day, 'EEE', { locale: fr }),
      fullDate: format(day, 'dd/MM'),
      earnings: report?.net_earnings || 0,
      trips: report?.total_trips || 0,
    };
  });

  // Stats calculées
  const avgDailyEarnings = earningsData.reduce((sum, d) => sum + d.earnings, 0) / 7;
  const totalTripsWeek = earningsData.reduce((sum, d) => sum + d.trips, 0);
  const bestDay = earningsData.reduce((best, d) => (d.earnings > best.earnings ? d : best), earningsData[0]);

  // Données pour le pie chart des dépenses
  const expenseData = [
    { name: 'Carburant', value: 45000, icon: Fuel },
    { name: 'Entretien', value: 15000, icon: MapPin },
    { name: 'Divers', value: 8000, icon: Clock },
  ];

  return (
    <MobileLayout showNav={false} showThemeToggle={false}>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <header className="safe-top px-4 pt-4 pb-3 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/driver')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Analytics</h1>
              <p className="text-sm text-muted-foreground">Performance et tendances</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* KPIs rapides */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Moy. journalière</span>
                </div>
                <p className="text-2xl font-bold">{Math.round(avgDailyEarnings).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">FCFA / jour</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-muted-foreground">Meilleur jour</span>
                </div>
                <p className="text-2xl font-bold">{bestDay.earnings.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{bestDay.fullDate}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Courses semaine</span>
                </div>
                <p className="text-2xl font-bold">{totalTripsWeek}</p>
                <p className="text-xs text-muted-foreground">trajets effectués</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-muted-foreground">Score fiabilité</span>
                </div>
                <p className="text-2xl font-bold">
                  {reliabilityScore?.reliability_score?.toFixed(0) || 100}%
                </p>
                <Progress 
                  value={reliabilityScore?.reliability_score || 100} 
                  className="h-1.5 mt-1"
                />
              </CardContent>
            </Card>
          </div>

          {/* Graphique revenus 7 jours */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Revenus - 7 derniers jours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={earningsData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `${v / 1000}k`}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toLocaleString()} FCFA`, 'Revenus']}
                      labelFormatter={(label) => `Jour: ${label}`}
                    />
                    <Bar 
                      dataKey="earnings" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Graphique courses */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Nombre de courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={earningsData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="trips" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Répartition dépenses */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Répartition des dépenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="h-32 w-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={50}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {expenseData.map((entry, index) => (
                          <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {expenseData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: CHART_COLORS[index] }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">
                        {item.value.toLocaleString()} FCFA
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Objectifs */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4" />
                Objectifs hebdomadaires
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Revenus (objectif: 150k FCFA)</span>
                  <span className="font-medium">
                    {Math.round((earningsData.reduce((s, d) => s + d.earnings, 0) / 150000) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={(earningsData.reduce((s, d) => s + d.earnings, 0) / 150000) * 100} 
                  className="h-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Courses (objectif: 50)</span>
                  <span className="font-medium">{Math.round((totalTripsWeek / 50) * 100)}%</span>
                </div>
                <Progress value={(totalTripsWeek / 50) * 100} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Fiabilité (objectif: 90%)</span>
                  <span className="font-medium">
                    {reliabilityScore?.reliability_score?.toFixed(0) || 100}%
                  </span>
                </div>
                <Progress 
                  value={reliabilityScore?.reliability_score || 100} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
};

export default DriverAnalytics;
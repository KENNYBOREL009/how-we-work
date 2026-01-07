import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDriverDailyReports } from '@/hooks/useDriverDailyReports';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ChevronLeft,
  FileText,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Car,
  Fuel,
  Wrench,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DriverReports = () => {
  const navigate = useNavigate();
  const { reports, isLoading: loading } = useDriverDailyReports();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  // Calculs de synthèse
  const totalGross = reports.reduce((sum, r) => sum + (r.gross_earnings || 0), 0);
  const totalNet = reports.reduce((sum, r) => sum + (r.net_earnings || 0), 0);
  const totalTrips = reports.reduce((sum, r) => sum + (r.total_trips || 0), 0);
  const totalExpenses = reports.reduce((sum, r) => sum + (r.total_expenses || 0), 0);

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
              <h1 className="text-xl font-bold">Mes Rapports</h1>
              <p className="text-sm text-muted-foreground">Suivi financier quotidien</p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Synthèse période */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Synthèse</CardTitle>
                <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as 'week' | 'month')}>
                  <TabsList className="h-8">
                    <TabsTrigger value="week" className="text-xs px-3">7 jours</TabsTrigger>
                    <TabsTrigger value="month" className="text-xs px-3">30 jours</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <p className="text-xs text-muted-foreground">Recettes brutes</p>
                  <p className="text-xl font-bold text-primary">{totalGross.toLocaleString()} FCFA</p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/10">
                  <p className="text-xs text-muted-foreground">Recettes nettes</p>
                  <p className="text-xl font-bold text-green-600">{totalNet.toLocaleString()} FCFA</p>
                </div>
                <div className="p-3 rounded-xl bg-muted">
                  <p className="text-xs text-muted-foreground">Courses</p>
                  <p className="text-xl font-bold">{totalTrips}</p>
                </div>
                <div className="p-3 rounded-xl bg-destructive/10">
                  <p className="text-xs text-muted-foreground">Dépenses</p>
                  <p className="text-xl font-bold text-destructive">{totalExpenses.toLocaleString()} FCFA</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des rapports journaliers */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              RAPPORTS JOURNALIERS
            </h2>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Aucun rapport disponible</p>
                  <p className="text-sm text-muted-foreground">
                    Les rapports sont générés automatiquement après chaque journée
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <Card key={report.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">
                            {format(new Date(report.report_date), 'EEEE dd MMMM', { locale: fr })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {report.total_trips} courses • {report.total_distance_km || 0} km
                          </p>
                        </div>
                        <Badge
                          variant={report.is_validated ? 'default' : 'secondary'}
                          className={cn(
                            report.is_validated && 'bg-green-500'
                          )}
                        >
                          {report.is_validated ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Validé
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 mr-1" />
                              En attente
                            </>
                          )}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground">Brut</p>
                          <p className="font-semibold text-sm">
                            {(report.gross_earnings || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-destructive/10">
                          <p className="text-xs text-muted-foreground">Dépenses</p>
                          <p className="font-semibold text-sm text-destructive">
                            -{(report.total_expenses || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <p className="text-xs text-muted-foreground">Net</p>
                          <p className="font-semibold text-sm text-green-600">
                            {(report.net_earnings || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {report.notes && (
                        <p className="mt-3 text-sm text-muted-foreground italic">
                          "{report.notes}"
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default DriverReports;
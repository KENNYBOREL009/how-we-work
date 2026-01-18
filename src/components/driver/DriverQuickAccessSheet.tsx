import { useState } from 'react';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Coins, 
  BarChart3, 
  Settings, 
  TrendingUp, 
  Car, 
  Clock, 
  MapPin, 
  Coffee,
  Navigation,
  Power,
  ChevronRight,
  Wallet,
  Star,
  Target
} from 'lucide-react';

interface DriverStats {
  todayEarnings: number;
  todayTrips: number;
  weeklyEarnings: number;
  weeklyTrips: number;
  avgPerTrip: number;
  acceptanceRate: number;
  rating: number;
  hoursOnline: number;
}

interface DriverQuickAccessSheetProps {
  stats: DriverStats;
  isEmployee?: boolean;
  isOnBreak?: boolean;
  currentDestination?: string;
  onToggleBreak?: () => void;
  onSetDestination?: () => void;
  onSelectWorkZone?: () => void;
  onEndDay?: () => void;
}

export const DriverQuickAccessSheet = ({
  stats,
  isEmployee = false,
  isOnBreak = false,
  currentDestination,
  onToggleBreak,
  onSetDestination,
  onSelectWorkZone,
  onEndDay,
}: DriverQuickAccessSheetProps) => {
  const [open, setOpen] = useState(false);

  // Mock weekly data for chart
  const weeklyData = [
    { day: 'Lun', amount: 18500 },
    { day: 'Mar', amount: 22000 },
    { day: 'Mer', amount: 15000 },
    { day: 'Jeu', amount: 28500 },
    { day: 'Ven', amount: 32000 },
    { day: 'Sam', amount: 25000 },
    { day: 'Dim', amount: stats.todayEarnings },
  ];

  const maxAmount = Math.max(...weeklyData.map(d => d.amount));

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <div className="flex justify-center py-2 cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="h-1.5 w-12 bg-muted-foreground/30 rounded-full" />
        </div>
      </DrawerTrigger>
      
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/30 mb-4 mt-2" />
        
        <Tabs defaultValue="earnings" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mx-4 mb-4" style={{ width: 'calc(100% - 2rem)' }}>
            <TabsTrigger value="earnings" className="gap-2">
              <Coins className="w-4 h-4" />
              <span className="hidden sm:inline">Gains</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Réglages</span>
            </TabsTrigger>
          </TabsList>

          {/* EARNINGS TAB */}
          <TabsContent value="earnings" className="px-4 pb-6 space-y-4">
            {/* Today's summary */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Aujourd'hui</span>
                  <Badge variant="secondary">
                    <Clock className="w-3 h-3 mr-1" />
                    {stats.hoursOnline}h en ligne
                  </Badge>
                </div>
                <div className="text-4xl font-bold text-primary mb-1">
                  {stats.todayEarnings.toLocaleString()} <span className="text-lg">FCFA</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Car className="w-4 h-4" />
                    {stats.todayTrips} courses
                  </span>
                  <span>•</span>
                  <span>Moy: {stats.avgPerTrip.toLocaleString()} FCFA</span>
                </div>
              </CardContent>
            </Card>

            {/* Employee payment status */}
            {isEmployee && (
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        Versement propriétaire
                      </p>
                      <p className="text-2xl font-bold text-orange-600">
                        15,000 FCFA
                      </p>
                    </div>
                    <Badge variant="outline" className="border-orange-400 text-orange-600">
                      En attente
                    </Badge>
                  </div>
                  <Progress value={60} className="mt-3 h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    60% de l'objectif quotidien
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Earnings breakdown */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  Répartition
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Wallet App</span>
                    <span className="font-medium">18,000 FCFA</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Espèces</span>
                    <span className="font-medium">10,500 FCFA</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Réservations</span>
                    <span className="font-medium">0 FCFA</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
              <ChevronRight className="w-4 h-4 mr-2" />
              Voir l'historique complet
            </Button>
          </TabsContent>

          {/* STATS TAB */}
          <TabsContent value="stats" className="px-4 pb-6 space-y-4">
            {/* Weekly chart */}
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Cette semaine
                </h4>
                <div className="flex items-end justify-between h-32 gap-1">
                  {weeklyData.map((data, i) => (
                    <div key={data.day} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className={`w-full rounded-t transition-all ${
                          i === weeklyData.length - 1 
                            ? 'bg-primary' 
                            : 'bg-primary/30'
                        }`}
                        style={{ height: `${(data.amount / maxAmount) * 100}%`, minHeight: '8px' }}
                      />
                      <span className="text-xs text-muted-foreground">{data.day}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                  <span className="text-muted-foreground">Total semaine</span>
                  <span className="font-bold text-primary">
                    {stats.weeklyEarnings.toLocaleString()} FCFA
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Performance metrics */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-2xl font-bold">{stats.rating}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Note moyenne</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.acceptanceRate}%</div>
                  <p className="text-xs text-muted-foreground">Taux acceptation</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold">{stats.weeklyTrips}</div>
                  <p className="text-xs text-muted-foreground">Courses/semaine</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round(stats.weeklyEarnings / stats.weeklyTrips).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">FCFA/course</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="px-4 pb-6 space-y-3">
            {/* Break toggle */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isOnBreak ? 'bg-orange-100 dark:bg-orange-900' : 'bg-muted'}`}>
                      <Coffee className={`w-5 h-5 ${isOnBreak ? 'text-orange-600' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="font-medium">Mode pause</p>
                      <p className="text-xs text-muted-foreground">
                        {isOnBreak ? 'Vous ne recevez pas de courses' : 'Désactivé'}
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={isOnBreak} 
                    onCheckedChange={onToggleBreak}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Set destination */}
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={onSetDestination}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                      <Navigation className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Direction préférée</p>
                      <p className="text-xs text-muted-foreground">
                        {currentDestination || 'Non définie'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            {/* Work zone selector */}
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={onSelectWorkZone}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Zone de travail</p>
                      <p className="text-xs text-muted-foreground">Sélectionner vos quartiers</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            {/* End day button */}
            <Button 
              variant="destructive" 
              className="w-full mt-4"
              onClick={onEndDay}
            >
              <Power className="w-4 h-4 mr-2" />
              Terminer la journée
            </Button>
          </TabsContent>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
};

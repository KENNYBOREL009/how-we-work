import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Bus,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  Navigation,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Wallet,
  TrendingUp,
  Plus,
  Minus,
  BarChart3,
  Fuel,
  FileText,
  Armchair,
  Timer,
  CircleDot,
  Play,
  Square,
  SkipForward,
  Bell,
  Ban,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

// Types
interface BusStop {
  id: string;
  name: string;
  address?: string;
  arrivalTime?: string;
  status: 'completed' | 'current' | 'upcoming';
  passengersOn: number;
  passengersOff: number;
}

interface BusServiceReport {
  totalPassengers: number;
  totalRevenue: number;
  tripsCompleted: number;
  delays: number;
  incidents: number;
  distanceKm: number;
  startTime: string;
  currentTime: string;
}

type ServiceState = 'idle' | 'en_route' | 'at_stop' | 'completed';
type Impediment = 'traffic' | 'breakdown' | 'accident' | 'weather' | 'other';

const MOCK_ROUTE = {
  id: 'route-1',
  name: 'Ligne 7 - Akwa ↔ Bonabéri',
  routeNumber: 'L7',
  color: '#2563EB',
  operator: 'SOCATUR',
};

const INITIAL_STOPS: BusStop[] = [
  { id: '1', name: 'Gare Routière Akwa', address: 'Centre Akwa', arrivalTime: '06:00', status: 'completed', passengersOn: 12, passengersOff: 0 },
  { id: '2', name: 'Carrefour Ndokoti', address: 'Ndokoti', arrivalTime: '06:15', status: 'completed', passengersOn: 8, passengersOff: 3 },
  { id: '3', name: 'Rond-Point Deido', address: 'Deido', arrivalTime: '06:28', status: 'current', passengersOn: 0, passengersOff: 0 },
  { id: '4', name: 'Carrefour Bessengue', address: 'Bessengue', arrivalTime: '06:40', status: 'upcoming', passengersOn: 0, passengersOff: 0 },
  { id: '5', name: 'Pont du Wouri', address: 'Wouri', arrivalTime: '06:50', status: 'upcoming', passengersOn: 0, passengersOff: 0 },
  { id: '6', name: 'Gare Bonabéri', address: 'Bonabéri Centre', arrivalTime: '07:05', status: 'upcoming', passengersOn: 0, passengersOff: 0 },
];

const BusDriverDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const driverName = user?.email?.split('@')[0] || 'Conducteur';

  // State
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [serviceState, setServiceState] = useState<ServiceState>('idle');
  const [stops, setStops] = useState<BusStop[]>(INITIAL_STOPS);
  const [currentStopIndex, setCurrentStopIndex] = useState(2);
  const [passengersOnBoard, setPassengersOnBoard] = useState(17);
  const [busCapacity] = useState(70);
  const [tempBoardingCount, setTempBoardingCount] = useState(0);
  const [tempAlightingCount, setTempAlightingCount] = useState(0);
  const [tripCount, setTripCount] = useState(2);
  const [totalRevenue, setTotalRevenue] = useState(34000);
  const [walletBalance] = useState(85000);
  const [incidents, setIncidents] = useState(0);
  const [delays, setDelays] = useState(0);
  const [distanceKm, setDistanceKm] = useState(18.4);
  const [startTime] = useState('06:00');
  const [reservedSeats] = useState(3);

  const currentStop = stops[currentStopIndex];
  const completedStops = stops.filter(s => s.status === 'completed').length;
  const progressPercent = (completedStops / stops.length) * 100;
  const occupancyPercent = (passengersOnBoard / busCapacity) * 100;

  // Toggle duty
  const handleToggleDuty = useCallback(() => {
    const newDuty = !isOnDuty;
    setIsOnDuty(newDuty);
    if (newDuty) {
      setServiceState('en_route');
      toast.success('Service démarré !', { description: `${MOCK_ROUTE.name}` });
    } else {
      setServiceState('idle');
      toast.info('Service terminé');
    }
  }, [isOnDuty]);

  // Arrive at current stop
  const handleArriveAtStop = useCallback(() => {
    setServiceState('at_stop');
    setTempBoardingCount(0);
    setTempAlightingCount(0);
    toast.success(`📍 Arrêt: ${currentStop?.name}`, { description: 'Gestion des passagers...' });
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
  }, [currentStop]);

  // Confirm passengers and leave stop
  const handleLeaveStop = useCallback(() => {
    const newOnBoard = passengersOnBoard + tempBoardingCount - tempAlightingCount;
    setPassengersOnBoard(Math.max(0, newOnBoard));
    setTotalRevenue(prev => prev + tempBoardingCount * 250);

    // Update stops
    setStops(prev => prev.map((stop, idx) => {
      if (idx === currentStopIndex) {
        return { ...stop, status: 'completed' as const, passengersOn: tempBoardingCount, passengersOff: tempAlightingCount };
      }
      if (idx === currentStopIndex + 1) {
        return { ...stop, status: 'current' as const };
      }
      return stop;
    }));

    if (currentStopIndex < stops.length - 1) {
      setCurrentStopIndex(prev => prev + 1);
      setServiceState('en_route');
      toast.info('🚌 En route vers le prochain arrêt');
    } else {
      // Trip completed
      setServiceState('completed');
      setTripCount(prev => prev + 1);
      setDistanceKm(prev => prev + 12.5);
      toast.success('🎉 Trajet terminé !', { description: 'Rapport disponible' });
    }
  }, [passengersOnBoard, tempBoardingCount, tempAlightingCount, currentStopIndex, stops.length]);

  // Start new trip
  const handleNewTrip = useCallback(() => {
    setStops(INITIAL_STOPS.map((s, i) => ({
      ...s,
      status: i === 0 ? 'current' as const : 'upcoming' as const,
      passengersOn: 0,
      passengersOff: 0,
    })));
    setCurrentStopIndex(0);
    setPassengersOnBoard(0);
    setServiceState('en_route');
    toast.success('Nouveau trajet démarré !');
  }, []);

  // Report impediment
  const handleReportImpediment = useCallback((type: Impediment) => {
    setIncidents(prev => prev + 1);
    const labels: Record<Impediment, string> = {
      traffic: '🚗 Embouteillage',
      breakdown: '🔧 Panne',
      accident: '⚠️ Accident',
      weather: '🌧️ Intempérie',
      other: '📋 Autre',
    };
    toast.warning(`Incident signalé: ${labels[type]}`);
  }, []);

  const currentTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <MobileLayout showNav={false} showThemeToggle={false}>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-card border-b">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Conducteur Bus</p>
                  <p className="text-xs text-muted-foreground">{MOCK_ROUTE.operator} • {MOCK_ROUTE.routeNumber}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={isOnDuty}
                onCheckedChange={handleToggleDuty}
                className={cn(isOnDuty && "data-[state=checked]:bg-green-500")}
              />
              <span className={cn("text-xs font-medium", isOnDuty ? "text-green-600" : "text-muted-foreground")}>
                {isOnDuty ? 'EN SERVICE' : 'REPOS'}
              </span>
            </div>
          </div>

          {/* Quick stats bar */}
          {isOnDuty && (
            <div className="flex justify-around py-2 bg-muted/50 text-xs font-medium border-t">
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>{passengersOnBoard}/{busCapacity}</span>
              </div>
              <div className="flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-green-600" />
                <span>{completedStops}/{stops.length} arrêts</span>
              </div>
              <div className="flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-amber-600" />
                <span>{totalRevenue.toLocaleString()} F</span>
              </div>
              <div className="flex items-center gap-1">
                <Armchair className="w-3.5 h-3.5 text-purple-600" />
                <span>{reservedSeats} rés.</span>
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        {!isOnDuty ? (
          /* Idle state */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <Bus className="w-24 h-24 text-muted-foreground/20 mb-6" />
            <h2 className="text-xl font-bold mb-2">Mode Bus Conducteur</h2>
            <p className="text-muted-foreground mb-6 max-w-xs">
              Activez le service pour démarrer votre ligne et gérer les passagers
            </p>
            <Card className="w-full max-w-sm mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: MOCK_ROUTE.color }} />
                  <div>
                    <p className="font-semibold">{MOCK_ROUTE.name}</p>
                    <p className="text-xs text-muted-foreground">{stops.length} arrêts • ~35 min</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-muted rounded-lg">
                    <p className="font-bold text-lg">{tripCount}</p>
                    <p className="text-muted-foreground">Trajets</p>
                  </div>
                  <div className="p-2 bg-muted rounded-lg">
                    <p className="font-bold text-lg">{totalRevenue.toLocaleString()}</p>
                    <p className="text-muted-foreground">FCFA</p>
                  </div>
                  <div className="p-2 bg-muted rounded-lg">
                    <p className="font-bold text-lg">{distanceKm.toFixed(0)}</p>
                    <p className="text-muted-foreground">km</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Button size="lg" className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700" onClick={handleToggleDuty}>
              <Play className="w-5 h-5 mr-2" />
              Démarrer le service
            </Button>
          </div>
        ) : (
          /* Active service */
          <Tabs defaultValue="route" className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-4 mx-3 mt-2">
              <TabsTrigger value="route" className="text-xs gap-1">
                <Navigation className="w-3.5 h-3.5" />
                Route
              </TabsTrigger>
              <TabsTrigger value="passengers" className="text-xs gap-1">
                <Users className="w-3.5 h-3.5" />
                Passagers
              </TabsTrigger>
              <TabsTrigger value="finance" className="text-xs gap-1">
                <Wallet className="w-3.5 h-3.5" />
                Solde
              </TabsTrigger>
              <TabsTrigger value="report" className="text-xs gap-1">
                <FileText className="w-3.5 h-3.5" />
                Rapport
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              {/* ===== TAB ROUTE ===== */}
              <TabsContent value="route" className="p-3 space-y-3 mt-0">
                {/* Route progress */}
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MOCK_ROUTE.color }} />
                        {MOCK_ROUTE.routeNumber} - Progression
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {currentTime}
                      </Badge>
                    </div>
                    <Progress value={progressPercent} className="h-2 mb-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      {completedStops}/{stops.length} arrêts • {Math.round(progressPercent)}% complété
                    </p>
                  </CardContent>
                </Card>

                {/* Current stop highlight */}
                {serviceState === 'en_route' && currentStop && (
                  <Card className="border-2 border-blue-500 bg-blue-500/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs text-blue-600 font-medium">PROCHAIN ARRÊT</p>
                          <p className="text-lg font-bold">{currentStop.name}</p>
                          {currentStop.address && (
                            <p className="text-xs text-muted-foreground">{currentStop.address}</p>
                          )}
                        </div>
                        {currentStop.arrivalTime && (
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">{currentStop.arrivalTime}</p>
                            <p className="text-xs text-muted-foreground">prévu</p>
                          </div>
                        )}
                      </div>
                      <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700" onClick={handleArriveAtStop}>
                        <MapPin className="w-5 h-5 mr-2" />
                        Je suis à l'arrêt
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* At stop - Passenger management */}
                {serviceState === 'at_stop' && currentStop && (
                  <Card className="border-2 border-green-500 bg-green-500/5">
                    <CardContent className="p-4 space-y-4">
                      <div className="text-center">
                        <Badge className="bg-green-500 text-white mb-2">À L'ARRÊT</Badge>
                        <p className="text-lg font-bold">{currentStop.name}</p>
                      </div>

                      {/* Boarding / Alighting counters */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Montées */}
                        <div className="p-3 bg-green-500/10 rounded-xl text-center">
                          <p className="text-xs font-medium text-green-700 mb-2">🟢 Montées</p>
                          <div className="flex items-center justify-center gap-3">
                            <Button
                              size="icon"
                              variant="outline"
                              className="w-10 h-10 rounded-full"
                              onClick={() => setTempBoardingCount(prev => Math.max(0, prev - 1))}
                              disabled={tempBoardingCount === 0}
                            >
                              <Minus className="w-5 h-5" />
                            </Button>
                            <span className="text-3xl font-black text-green-600">{tempBoardingCount}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="w-10 h-10 rounded-full"
                              onClick={() => setTempBoardingCount(prev => prev + 1)}
                              disabled={passengersOnBoard + tempBoardingCount - tempAlightingCount >= busCapacity}
                            >
                              <Plus className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>

                        {/* Descentes */}
                        <div className="p-3 bg-red-500/10 rounded-xl text-center">
                          <p className="text-xs font-medium text-red-700 mb-2">🔴 Descentes</p>
                          <div className="flex items-center justify-center gap-3">
                            <Button
                              size="icon"
                              variant="outline"
                              className="w-10 h-10 rounded-full"
                              onClick={() => setTempAlightingCount(prev => Math.max(0, prev - 1))}
                              disabled={tempAlightingCount === 0}
                            >
                              <Minus className="w-5 h-5" />
                            </Button>
                            <span className="text-3xl font-black text-red-600">{tempAlightingCount}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="w-10 h-10 rounded-full"
                              onClick={() => setTempAlightingCount(prev => prev + 1)}
                              disabled={tempAlightingCount >= passengersOnBoard}
                            >
                              <Plus className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Occupancy preview */}
                      <div className="p-2 bg-muted rounded-lg text-center text-sm">
                        <span className="text-muted-foreground">Après cet arrêt: </span>
                        <span className="font-bold">{passengersOnBoard + tempBoardingCount - tempAlightingCount}</span>
                        <span className="text-muted-foreground"> / {busCapacity} passagers</span>
                      </div>

                      <Button className="w-full h-12 bg-green-600 hover:bg-green-700" onClick={handleLeaveStop}>
                        <SkipForward className="w-5 h-5 mr-2" />
                        Valider et repartir
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Trip completed */}
                {serviceState === 'completed' && (
                  <Card className="border-2 border-amber-500 bg-amber-500/5">
                    <CardContent className="p-4 text-center space-y-3">
                      <CheckCircle2 className="w-16 h-16 text-amber-500 mx-auto" />
                      <h3 className="text-lg font-bold">Trajet terminé !</h3>
                      <p className="text-sm text-muted-foreground">
                        {stops.reduce((sum, s) => sum + s.passengersOn, 0)} montées •{' '}
                        {stops.reduce((sum, s) => sum + s.passengersOff, 0)} descentes
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => { setServiceState('idle'); setIsOnDuty(false); }}>
                          <Square className="w-4 h-4 mr-2" />
                          Fin de service
                        </Button>
                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleNewTrip}>
                          <Play className="w-4 h-4 mr-2" />
                          Nouveau trajet
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Stops timeline */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Arrêts de la ligne
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="relative pl-6">
                      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
                      {stops.map((stop, idx) => (
                        <div key={stop.id} className="relative pb-4 last:pb-0">
                          <div className={cn(
                            "absolute left-[-18px] top-1 w-3 h-3 rounded-full border-2",
                            stop.status === 'completed' && "bg-green-500 border-green-600",
                            stop.status === 'current' && "bg-blue-500 border-blue-600 animate-pulse",
                            stop.status === 'upcoming' && "bg-muted border-border",
                          )} />
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={cn(
                                "text-sm font-medium",
                                stop.status === 'completed' && "text-muted-foreground line-through",
                                stop.status === 'current' && "text-blue-600 font-bold",
                              )}>
                                {stop.name}
                              </p>
                              {stop.status === 'completed' && (stop.passengersOn > 0 || stop.passengersOff > 0) && (
                                <p className="text-xs text-muted-foreground">
                                  +{stop.passengersOn} / -{stop.passengersOff}
                                </p>
                              )}
                            </div>
                            {stop.arrivalTime && (
                              <Badge variant="outline" className="text-xs">
                                {stop.arrivalTime}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Impediment buttons */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Signaler un empêchement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { type: 'traffic' as const, icon: '🚗', label: 'Bouchon' },
                        { type: 'breakdown' as const, icon: '🔧', label: 'Panne' },
                        { type: 'accident' as const, icon: '⚠️', label: 'Accident' },
                      ]).map(imp => (
                        <Button
                          key={imp.type}
                          variant="outline"
                          className="h-14 flex-col gap-1 text-xs"
                          onClick={() => handleReportImpediment(imp.type)}
                        >
                          <span className="text-lg">{imp.icon}</span>
                          {imp.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ===== TAB PASSENGERS ===== */}
              <TabsContent value="passengers" className="p-3 space-y-3 mt-0">
                {/* Occupancy card */}
                <Card className="border-2 border-blue-500/30">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Taux d'occupation</p>
                    <p className="text-5xl font-black text-blue-600">{passengersOnBoard}</p>
                    <p className="text-sm text-muted-foreground mb-3">sur {busCapacity} places</p>
                    <Progress value={occupancyPercent} className="h-3 mb-2" />
                    <p className={cn(
                      "text-xs font-medium",
                      occupancyPercent > 90 ? "text-red-600" : occupancyPercent > 70 ? "text-amber-600" : "text-green-600"
                    )}>
                      {Math.round(occupancyPercent)}% • {busCapacity - passengersOnBoard} places libres
                    </p>
                  </CardContent>
                </Card>

                {/* Reserved seats */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Armchair className="w-4 h-4 text-purple-600" />
                        Réservations actives
                      </h3>
                      <Badge className="bg-purple-500/10 text-purple-700">{reservedSeats}</Badge>
                    </div>
                    <div className="space-y-2">
                      {[
                        { name: 'Jean K.', stop: 'Rond-Point Deido', seats: 1 },
                        { name: 'Marie O.', stop: 'Carrefour Bessengue', seats: 2 },
                      ].map((res, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs">{res.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{res.name}</p>
                              <p className="text-xs text-muted-foreground">{res.stop}</p>
                            </div>
                          </div>
                          <Badge variant="secondary">{res.seats} place(s)</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick passenger counter */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-3">Ajustement rapide</h3>
                    <div className="flex items-center justify-center gap-6">
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-16 h-16 rounded-2xl text-2xl border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => setPassengersOnBoard(prev => Math.max(0, prev - 1))}
                        disabled={passengersOnBoard === 0}
                      >
                        <Minus className="w-8 h-8" />
                      </Button>
                      <div className="text-center">
                        <p className="text-4xl font-black">{passengersOnBoard}</p>
                        <p className="text-xs text-muted-foreground">à bord</p>
                      </div>
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-16 h-16 rounded-2xl text-2xl border-green-300 text-green-600 hover:bg-green-50"
                        onClick={() => setPassengersOnBoard(prev => Math.min(busCapacity, prev + 1))}
                        disabled={passengersOnBoard >= busCapacity}
                      >
                        <Plus className="w-8 h-8" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Destination info */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-primary" />
                      Destination actuelle
                    </h3>
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <p className="font-bold text-blue-700">{MOCK_ROUTE.name.split('↔')[1]?.trim() || 'Bonabéri'}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stops.length - completedStops} arrêts restants • ETA ~{(stops.length - completedStops) * 8} min
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ===== TAB FINANCE ===== */}
              <TabsContent value="finance" className="p-3 space-y-3 mt-0">
                {/* Wallet balance */}
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Mon Solde</p>
                    <p className="text-3xl font-bold text-primary">
                      {walletBalance.toLocaleString()} <span className="text-base">FCFA</span>
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Retirer
                      </Button>
                      <Button size="sm" className="flex-1">
                        <Wallet className="w-4 h-4 mr-1" />
                        Recharger
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Today earnings */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-3">Recettes du jour</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-green-500/10 rounded-xl text-center">
                        <p className="text-2xl font-bold text-green-600">{totalRevenue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Total collecté</p>
                      </div>
                      <div className="p-3 bg-amber-500/10 rounded-xl text-center">
                        <p className="text-2xl font-bold text-amber-600">{(reservedSeats * 250).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Réservations</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment history */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-3">Dernières transactions</h3>
                    <div className="space-y-2">
                      {[
                        { desc: 'Trajet Akwa → Bonabéri', amount: 17500, time: '08:30' },
                        { desc: 'Trajet Bonabéri → Akwa', amount: 16500, time: '07:15' },
                        { desc: 'Carburant', amount: -12000, time: '06:45' },
                      ].map((tx, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <div>
                            <p className="text-sm font-medium">{tx.desc}</p>
                            <p className="text-xs text-muted-foreground">{tx.time}</p>
                          </div>
                          <span className={cn(
                            "text-sm font-bold",
                            tx.amount >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()} F
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ===== TAB REPORT ===== */}
              <TabsContent value="report" className="p-3 space-y-3 mt-0">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Rapport de service
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: <Bus className="w-5 h-5 text-blue-600" />, label: 'Trajets', value: tripCount.toString() },
                        { icon: <Users className="w-5 h-5 text-green-600" />, label: 'Passagers', value: stops.reduce((s, st) => s + st.passengersOn, 0).toString() },
                        { icon: <Wallet className="w-5 h-5 text-amber-600" />, label: 'Recettes', value: `${totalRevenue.toLocaleString()} F` },
                        { icon: <Navigation className="w-5 h-5 text-purple-600" />, label: 'Distance', value: `${distanceKm.toFixed(1)} km` },
                        { icon: <Clock className="w-5 h-5 text-cyan-600" />, label: 'Service', value: `${startTime} - ${currentTime}` },
                        { icon: <AlertTriangle className="w-5 h-5 text-red-600" />, label: 'Incidents', value: incidents.toString() },
                      ].map((stat, i) => (
                        <div key={i} className="p-3 bg-muted rounded-xl text-center">
                          <div className="flex justify-center mb-1">{stat.icon}</div>
                          <p className="text-lg font-bold">{stat.value}</p>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Stop-by-stop summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Détail par arrêt</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      {stops.filter(s => s.status === 'completed').map((stop) => (
                        <div key={stop.id} className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="font-medium">{stop.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-green-600">+{stop.passengersOn}</span>
                            <span className="text-red-600">-{stop.passengersOff}</span>
                          </div>
                        </div>
                      ))}
                      {stops.filter(s => s.status === 'completed').length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Aucun arrêt complété</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* End of day button */}
                <Button
                  variant="destructive"
                  className="w-full h-12"
                  onClick={() => {
                    setIsOnDuty(false);
                    setServiceState('idle');
                    toast.success('Rapport de fin de journée généré');
                    navigate('/');
                  }}
                >
                  <Square className="w-4 h-4 mr-2" />
                  Terminer la journée
                </Button>
              </TabsContent>
            </div>
          </Tabs>
        )}

        {/* Bottom nav */}
        <div className="p-3 border-t bg-background flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>
            Mode passager
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate('/driver')}>
            Mode Taxi
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default BusDriverDashboard;

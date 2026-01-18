import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Car,
  Wallet,
  TrendingUp,
  Star,
  Clock,
  MapPin,
  Navigation,
  Phone,
  MessageSquare,
  Coffee,
  Target,
  ChevronUp,
  X,
  Check,
  Users,
  Coins,
  BarChart3,
  Settings,
  Power,
  CornerDownLeft,
  ArrowUp,
  Volume2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Types
type CockpitState = 'idle' | 'incoming' | 'active';
type TripStage = 'pickup' | 'waiting' | 'onboard';
type SeatStatus = 'empty' | 'occupied' | 'reserved';

interface RideRequest {
  id: string;
  clientName: string;
  clientAvatar?: string;
  clientRating: number;
  clientTripCount: number;
  origin: string;
  destination: string;
  distance: string;
  duration: string;
  fare: number;
  isShared?: boolean;
  passengerCount?: number;
}

interface ActiveTrip {
  id: string;
  clientName: string;
  clientAvatar?: string;
  clientPhone: string;
  origin: string;
  destination: string;
  fare: number;
  distanceRemaining: string;
}

interface DriverStats {
  todayTrips: number;
  todayEarnings: number;
  rating: number;
  hoursWorked: number;
  acceptanceRate: number;
  reliabilityScore: number;
}

interface Seat {
  id: number;
  status: SeatStatus;
}

interface DriverCockpitProps {
  driverName: string;
  driverAvatar?: string;
  stats: DriverStats;
  isOnline: boolean;
  isTaxiCollectifMode?: boolean;
  currentDestination?: string;
  onToggleOnline: () => void;
  onAcceptRide: (requestId: string) => void;
  onDeclineRide: (requestId: string) => void;
  onUpdateTripStatus: () => void;
  onCallClient?: () => void;
  onChatClient?: () => void;
  onEndDay?: () => void;
}

export const DriverCockpit = ({
  driverName,
  driverAvatar,
  stats,
  isOnline,
  isTaxiCollectifMode = false,
  currentDestination = 'Bonanjo',
  onToggleOnline,
  onAcceptRide,
  onDeclineRide,
  onUpdateTripStatus,
  onCallClient,
  onChatClient,
  onEndDay,
}: DriverCockpitProps) => {
  // State
  const [cockpitState, setCockpitState] = useState<CockpitState>('idle');
  const [tripStage, setTripStage] = useState<TripStage>('pickup');
  const [countdown, setCountdown] = useState(30);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [seats, setSeats] = useState<Seat[]>([
    { id: 1, status: 'occupied' },
    { id: 2, status: 'reserved' },
    { id: 3, status: 'empty' },
    { id: 4, status: 'empty' },
  ]);

  // Mock data
  const [incomingRequest, setIncomingRequest] = useState<RideRequest | null>(null);
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);

  // Simulate incoming request when online
  useEffect(() => {
    if (!isOnline || cockpitState !== 'idle') return;

    const timeout = setTimeout(() => {
      setIncomingRequest({
        id: `ride-${Date.now()}`,
        clientName: 'Lomié Kenny',
        clientRating: 4.9,
        clientTripCount: 23,
        origin: '(rue 000) Bonanjo Centre',
        destination: '(rue 0001) Akwa Nord',
        distance: '2.3',
        duration: '6',
        fare: 2500,
        isShared: false,
        passengerCount: 1,
      });
      setCockpitState('incoming');
      setCountdown(30);

      // Sound + vibration
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.7;
        audio.play().catch(() => {});
      } catch {}
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    }, 8000);

    return () => clearTimeout(timeout);
  }, [isOnline, cockpitState]);

  // Countdown timer
  useEffect(() => {
    if (cockpitState !== 'incoming' || !incomingRequest) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleDeclineRequest();
          toast.error('Course expirée');
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cockpitState, incomingRequest]);

  // Handlers
  const handleAcceptRequest = useCallback(() => {
    if (!incomingRequest) return;

    setActiveTrip({
      id: incomingRequest.id,
      clientName: incomingRequest.clientName,
      clientAvatar: incomingRequest.clientAvatar,
      clientPhone: '+237 6XX XXX XXX',
      origin: incomingRequest.origin,
      destination: incomingRequest.destination,
      fare: incomingRequest.fare,
      distanceRemaining: incomingRequest.distance,
    });
    
    setCockpitState('active');
    setTripStage('pickup');
    setIncomingRequest(null);
    onAcceptRide(incomingRequest.id);
    toast.success('Course acceptée !');
    
    if ('vibrate' in navigator) navigator.vibrate(100);
  }, [incomingRequest, onAcceptRide]);

  const handleDeclineRequest = useCallback(() => {
    if (!incomingRequest) return;
    onDeclineRide(incomingRequest.id);
    setIncomingRequest(null);
    setCockpitState('idle');
  }, [incomingRequest, onDeclineRide]);

  const handleMarkArrived = useCallback(() => {
    setTripStage('waiting');
    toast.success('Arrivée signalée au client');
    if ('vibrate' in navigator) navigator.vibrate(50);
  }, []);

  const handleStartTrip = useCallback(() => {
    setTripStage('onboard');
    toast.success('Course démarrée !');
    if ('vibrate' in navigator) navigator.vibrate(50);
  }, []);

  const handleEndTrip = useCallback(() => {
    setCockpitState('idle');
    setActiveTrip(null);
    setTripStage('pickup');
    onUpdateTripStatus();
    toast.success('🎉 Course terminée !', { description: `+${activeTrip?.fare.toLocaleString()} FCFA` });
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
  }, [activeTrip, onUpdateTripStatus]);

  const handleBookSeat = useCallback((seatId: number) => {
    setSeats(prev => prev.map(s => 
      s.id === seatId && s.status === 'empty' 
        ? { ...s, status: 'reserved' as SeatStatus }
        : s
    ));
    toast.success(`Place ${seatId} réservée !`);
  }, []);

  const occupiedSeats = seats.filter(s => s.status !== 'empty').length;
  const avgPerTrip = stats.todayTrips > 0 ? Math.round(stats.todayEarnings / stats.todayTrips) : 0;

  // Countdown circle calculations
  const progress = (countdown / 30) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const isExpiring = countdown <= 10;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* ========== HEADER FIXE ========== */}
      <header className="sticky top-0 z-50 bg-background border-b">
        {/* Main header row */}
        <div className="flex items-center justify-between p-4">
          {/* Online toggle */}
          <div className="flex items-center gap-3">
            <Switch
              checked={isOnline}
              onCheckedChange={onToggleOnline}
              className={cn(
                "scale-125 transition-all",
                isOnline && "data-[state=checked]:bg-green-500"
              )}
            />
            <span className={cn(
              "font-semibold transition-colors",
              isOnline ? "text-green-600" : "text-muted-foreground"
            )}>
              {isOnline ? '🟢 EN LIGNE' : '⚪ HORS LIGNE'}
            </span>
          </div>

          {/* Driver profile */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="font-semibold text-sm">{driverName}</p>
              <p className="text-xs text-muted-foreground">
                Score: {stats.reliabilityScore}%
              </p>
            </div>
            <Avatar className="w-10 h-10 border-2 border-primary">
              <AvatarImage src={driverAvatar} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {driverName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Mini stats bar */}
        <div className="flex justify-around bg-muted/50 py-2 text-xs font-medium">
          <div className="flex items-center gap-1">
            <Car className="w-3.5 h-3.5 text-primary" />
            <span>{stats.todayTrips}</span>
          </div>
          <div className="flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-green-600" />
            <span>{stats.todayEarnings.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span>{stats.rating}/5</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>{stats.hoursWorked}h</span>
          </div>
        </div>
      </header>

      {/* ========== MAIN CONTENT ========== */}
      <main className="flex-1 overflow-hidden relative">
        {/* ÉTAT IDLE */}
        {cockpitState === 'idle' && (
          <div className="h-full relative animate-fade-in">
            {/* Map placeholder with gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-muted/30 to-muted/60">
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MapPin className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">Carte des hotspots</p>
                  <p className="text-xs">Affichage des signaux clients</p>
                </div>
              </div>
            </div>

            {/* Taxi Collectif Seat Manager */}
            {isTaxiCollectifMode && (
              <div className="absolute top-4 right-4 z-10">
                <Card className="glass shadow-elevated">
                  <CardContent className="p-3">
                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                      {seats.map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => seat.status === 'empty' && handleBookSeat(seat.id)}
                          disabled={seat.status !== 'empty'}
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all",
                            seat.status === 'occupied' && "bg-green-500 text-white",
                            seat.status === 'reserved' && "bg-yellow-500 text-white",
                            seat.status === 'empty' && "bg-muted hover:bg-primary/20 cursor-pointer"
                          )}
                        >
                          {seat.status === 'occupied' ? '🟢' : seat.status === 'reserved' ? '🟡' : '⚪'}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-center font-medium">
                      {occupiedSeats}/4 · {currentDestination}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Floating stats card */}
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <Card className="glass shadow-elevated">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Aujourd'hui
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <Car className="w-6 h-6 mx-auto mb-1 text-primary" />
                      <p className="text-2xl font-bold">{stats.todayTrips}</p>
                      <p className="text-xs text-muted-foreground">Courses</p>
                    </div>
                    <div className="text-center">
                      <Wallet className="w-6 h-6 mx-auto mb-1 text-green-600" />
                      <p className="text-2xl font-bold">{Math.round(stats.todayEarnings / 1000)}k</p>
                      <p className="text-xs text-muted-foreground">FCFA</p>
                    </div>
                    <div className="text-center">
                      <TrendingUp className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                      <p className="text-2xl font-bold">{avgPerTrip.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Moy/course</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ÉTAT INCOMING REQUEST */}
        {cockpitState === 'incoming' && incomingRequest && (
          <div className="h-full flex flex-col items-center justify-center p-6 animate-scale-in bg-background">
            {/* Timer circulaire */}
            <div className="relative w-28 h-28 mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="6"
                />
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke={isExpiring ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn(
                  "text-3xl font-bold",
                  isExpiring && "text-destructive animate-pulse"
                )}>
                  {countdown}
                </span>
                <span className="text-xs text-muted-foreground">sec</span>
              </div>
            </div>

            {/* Client info */}
            <Avatar className="w-20 h-20 mb-3 border-4 border-primary shadow-lg">
              <AvatarImage src={incomingRequest.clientAvatar} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {incomingRequest.clientName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold mb-1">{incomingRequest.clientName}</h2>
            <div className="flex items-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-4 h-4",
                    i < Math.floor(incomingRequest.clientRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted"
                  )}
                />
              ))}
              <span className="text-sm ml-1">{incomingRequest.clientRating}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              ({incomingRequest.clientTripCount} courses)
            </p>

            {/* Route card */}
            <Card className="w-full max-w-sm mb-4">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Point de départ</p>
                    <p className="font-semibold truncate">{incomingRequest.origin}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-2 mb-3">
                  <div className="w-0.5 h-6 bg-gradient-to-b from-green-500 to-primary" />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Navigation className="w-4 h-4" />
                    <span>{incomingRequest.distance} km</span>
                    <span>·</span>
                    <span>{incomingRequest.duration} min</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Destination</p>
                    <p className="font-semibold truncate">{incomingRequest.destination}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fare */}
            <Card className="w-full max-w-sm mb-6 bg-primary/5 border-primary/20">
              <CardContent className="py-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Tarif estimé</p>
                <p className="text-4xl font-bold text-primary">
                  {incomingRequest.fare.toLocaleString()}
                  <span className="text-lg ml-1">FCFA</span>
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <Button
                variant="outline"
                size="lg"
                className="h-14 text-lg border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleDeclineRequest}
              >
                <X className="w-5 h-5 mr-2" />
                Refuser
              </Button>
              <Button
                size="lg"
                className="h-14 text-lg bg-green-600 hover:bg-green-700 text-white"
                onClick={handleAcceptRequest}
              >
                <Check className="w-5 h-5 mr-2" />
                Accepter
              </Button>
            </div>
          </div>
        )}

        {/* ÉTAT ACTIVE TRIP */}
        {cockpitState === 'active' && activeTrip && (
          <div className="h-full relative animate-fade-in">
            {/* Map placeholder */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20">
              <div className="w-full h-full flex items-center justify-center">
                <Navigation className="w-24 h-24 text-primary/20" />
              </div>
            </div>

            {/* Navigation instruction - Top */}
            <div className="absolute top-4 left-4 right-4 z-10">
              <Card className="glass shadow-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
                      <CornerDownLeft className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold">Dans 200 mètres</p>
                      <p className="text-sm text-muted-foreground truncate">
                        Tournez à gauche sur Rue Joss
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-bold">{activeTrip.distanceRemaining}</p>
                      <p className="text-xs text-muted-foreground">km</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Client info - Bottom */}
            <div className="absolute bottom-32 left-4 right-4 z-10">
              <Card className="glass shadow-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border-2 border-primary">
                      <AvatarImage src={activeTrip.clientAvatar} />
                      <AvatarFallback>{activeTrip.clientName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{activeTrip.clientName}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {tripStage === 'pickup' && '🚗 En route vers le client'}
                        {tripStage === 'waiting' && '⏳ En attente du client'}
                        {tripStage === 'onboard' && `📍 Direction ${activeTrip.destination}`}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="icon" variant="ghost" onClick={onCallClient}>
                        <Phone className="w-5 h-5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={onChatClient}>
                        <MessageSquare className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* ========== BOTTOM ACTION ========== */}
      <div className="p-4 border-t bg-background">
        {cockpitState === 'active' && tripStage === 'pickup' && (
          <Button
            size="lg"
            className="w-full h-14 text-lg"
            onClick={handleMarkArrived}
          >
            <MapPin className="w-5 h-5 mr-2" />
            Je suis arrivé
          </Button>
        )}

        {cockpitState === 'active' && tripStage === 'waiting' && (
          <Button
            size="lg"
            className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
            onClick={handleStartTrip}
          >
            <ArrowUp className="w-5 h-5 mr-2" />
            Démarrer la course
          </Button>
        )}

        {cockpitState === 'active' && tripStage === 'onboard' && (
          <Button
            size="lg"
            className="w-full h-14 text-lg bg-orange-600 hover:bg-orange-700"
            onClick={handleEndTrip}
          >
            <Check className="w-5 h-5 mr-2" />
            Terminer ({activeTrip?.distanceRemaining} km restants)
          </Button>
        )}

        {cockpitState === 'idle' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={() => toast.info('Zones chaudes...')}
            >
              <Target className="w-4 h-4 mr-2" />
              Zones chaudes
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={() => toast.info('Mode pause...')}
            >
              <Coffee className="w-4 h-4 mr-2" />
              Pause
            </Button>
          </div>
        )}
      </div>

      {/* ========== BOTTOM SHEET TRIGGER ========== */}
      <Drawer open={showBottomSheet} onOpenChange={setShowBottomSheet}>
        <DrawerTrigger asChild>
          <div className="flex justify-center py-2 cursor-pointer hover:bg-muted/50 transition-colors border-t">
            <div className="flex flex-col items-center gap-1">
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
              <div className="h-1 w-10 bg-muted-foreground/30 rounded-full" />
            </div>
          </div>
        </DrawerTrigger>

        <DrawerContent className="max-h-[75vh]">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/30 mb-4 mt-2" />

          <Tabs defaultValue="earnings" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mx-4 mb-4" style={{ width: 'calc(100% - 2rem)' }}>
              <TabsTrigger value="earnings" className="gap-2">
                <Coins className="w-4 h-4" />
                Gains
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Stats
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="w-4 h-4" />
                Plus
              </TabsTrigger>
            </TabsList>

            <TabsContent value="earnings" className="px-4 pb-6 space-y-4">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="pt-4">
                  <div className="text-4xl font-bold text-primary mb-1">
                    {stats.todayEarnings.toLocaleString()} <span className="text-lg">FCFA</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stats.todayTrips} courses • Moy: {avgPerTrip.toLocaleString()} FCFA
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Wallet App</span>
                    <span className="font-medium">18,000 FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Espèces</span>
                    <span className="font-medium">10,500 FCFA</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="px-4 pb-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-2xl font-bold">{stats.rating}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Note</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.acceptanceRate}%
                    </div>
                    <p className="text-xs text-muted-foreground">Acceptation</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="px-4 pb-6 space-y-3">
              <Button variant="outline" className="w-full justify-start h-12">
                <Navigation className="w-4 h-4 mr-3" />
                Direction préférée
              </Button>
              <Button variant="outline" className="w-full justify-start h-12">
                <Target className="w-4 h-4 mr-3" />
                Zone de travail
              </Button>
              <Button variant="outline" className="w-full justify-start h-12">
                <Volume2 className="w-4 h-4 mr-3" />
                Sons et notifications
              </Button>
              <Button
                variant="destructive"
                className="w-full h-12 mt-4"
                onClick={onEndDay}
              >
                <Power className="w-4 h-4 mr-2" />
                Terminer la journée
              </Button>
            </TabsContent>
          </Tabs>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

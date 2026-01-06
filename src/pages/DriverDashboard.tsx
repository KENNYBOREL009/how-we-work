import { useState, useEffect } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Navigation, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  XCircle,
  Clock,
  Wallet,
  Star,
  Users,
  Car,
  TrendingUp,
  ChevronRight,
  Bell,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface PendingRide {
  id: string;
  clientName: string;
  clientAvatar?: string;
  origin: string;
  destination: string;
  distance: string;
  fare: number;
  isShared: boolean;
  passengerCount: number;
  expiresIn: number;
}

interface ActiveRide {
  id: string;
  clientName: string;
  clientPhone: string;
  origin: string;
  destination: string;
  fare: number;
  status: 'going_to_pickup' | 'waiting' | 'in_progress';
  eta: number;
}

const DriverDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(false);
  const [pendingRide, setPendingRide] = useState<PendingRide | null>(null);
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [acceptCountdown, setAcceptCountdown] = useState(30);
  
  // Mock driver stats
  const stats = {
    todayEarnings: 25500,
    todayTrips: 8,
    weekEarnings: 142000,
    rating: 4.8,
    acceptanceRate: 92
  };

  // Simulate receiving a ride request when online
  useEffect(() => {
    if (!isOnline || activeRide) return;

    const timeout = setTimeout(() => {
      setPendingRide({
        id: '1',
        clientName: 'Marie N.',
        origin: 'Akwa, Douala',
        destination: 'Bonanjo, Douala',
        distance: '4.2 km',
        fare: 2500,
        isShared: false,
        passengerCount: 1,
        expiresIn: 30
      });
      setAcceptCountdown(30);
      toast.info("🚗 Nouvelle course disponible !");
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isOnline, activeRide]);

  // Countdown for accepting ride
  useEffect(() => {
    if (!pendingRide) return;

    const interval = setInterval(() => {
      setAcceptCountdown(prev => {
        if (prev <= 1) {
          setPendingRide(null);
          toast.error("Course expirée");
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingRide]);

  const handleToggleOnline = () => {
    setIsOnline(!isOnline);
    toast.success(isOnline ? "Vous êtes maintenant hors ligne" : "Vous êtes maintenant en ligne");
  };

  const handleAcceptRide = () => {
    if (!pendingRide) return;
    
    setActiveRide({
      id: pendingRide.id,
      clientName: pendingRide.clientName,
      clientPhone: '+237 6XX XXX XXX',
      origin: pendingRide.origin,
      destination: pendingRide.destination,
      fare: pendingRide.fare,
      status: 'going_to_pickup',
      eta: 5
    });
    setPendingRide(null);
    toast.success("Course acceptée !");
  };

  const handleDeclineRide = () => {
    setPendingRide(null);
    toast.info("Course refusée");
  };

  const handleUpdateRideStatus = () => {
    if (!activeRide) return;

    if (activeRide.status === 'going_to_pickup') {
      setActiveRide({ ...activeRide, status: 'waiting', eta: 0 });
      toast.success("Vous êtes arrivé au point de départ");
    } else if (activeRide.status === 'waiting') {
      setActiveRide({ ...activeRide, status: 'in_progress', eta: 12 });
      toast.success("Course démarrée");
    } else {
      toast.success("Course terminée - Paiement reçu !");
      setActiveRide(null);
    }
  };

  return (
    <MobileLayout showNav={false} showThemeToggle={false}>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 border-2 border-white">
                <AvatarFallback className="bg-white/20 font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'C'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">Bonjour, Chauffeur</p>
                <div className="flex items-center gap-1 text-sm text-primary-foreground/80">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>{stats.rating}</span>
                  <span>•</span>
                  <span>{stats.acceptanceRate}% acceptation</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="text-primary-foreground">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-primary-foreground">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Online toggle */}
          <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full",
                isOnline ? "bg-green-400 animate-pulse" : "bg-gray-400"
              )} />
              <span className="font-medium">{isOnline ? "En service" : "Hors service"}</span>
            </div>
            <Switch checked={isOnline} onCheckedChange={handleToggleOnline} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Pending ride request */}
          {pendingRide && (
            <Card className="border-2 border-primary animate-pulse-slow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Car className="w-5 h-5 text-primary" />
                    Nouvelle course
                  </CardTitle>
                  <Badge variant="destructive" className="animate-pulse">
                    {acceptCountdown}s
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Client info */}
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{pendingRide.clientName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{pendingRide.clientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {pendingRide.isShared ? `Course partagée • ${pendingRide.passengerCount} passager(s)` : 'Course privée'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{pendingRide.fare.toLocaleString()} FCFA</p>
                    <p className="text-xs text-muted-foreground">{pendingRide.distance}</p>
                  </div>
                </div>

                {/* Route */}
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <div className="w-0.5 h-6 bg-border" />
                    <div className="w-3 h-3 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-sm">{pendingRide.origin}</p>
                    <p className="text-sm font-medium">{pendingRide.destination}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleDeclineRide}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Refuser
                  </Button>
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleAcceptRide}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Accepter
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active ride */}
          {activeRide && (
            <Card className="border-2 border-green-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-green-500" />
                    Course en cours
                  </CardTitle>
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    {activeRide.status === 'going_to_pickup' && 'En route pickup'}
                    {activeRide.status === 'waiting' && 'Client attendu'}
                    {activeRide.status === 'in_progress' && 'En course'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Client & ETA */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{activeRide.clientName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{activeRide.clientName}</p>
                      <p className="text-sm text-muted-foreground">{activeRide.fare.toLocaleString()} FCFA</p>
                    </div>
                  </div>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <Phone className="w-4 h-4" />
                  </Button>
                </div>

                {/* Destination highlight */}
                <div className="p-3 bg-muted rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {activeRide.status === 'going_to_pickup' ? 'Point de récupération' : 'Destination'}
                    </span>
                    {activeRide.eta > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        <Clock className="w-3 h-3 mr-1" />
                        {activeRide.eta} min
                      </Badge>
                    )}
                  </div>
                  <p className="font-semibold">
                    {activeRide.status === 'going_to_pickup' ? activeRide.origin : activeRide.destination}
                  </p>
                </div>

                {/* Action button */}
                <Button 
                  className="w-full h-14 text-base"
                  onClick={handleUpdateRideStatus}
                >
                  {activeRide.status === 'going_to_pickup' && (
                    <>
                      <MapPin className="w-5 h-5 mr-2" />
                      Je suis arrivé au point de départ
                    </>
                  )}
                  {activeRide.status === 'waiting' && (
                    <>
                      <Navigation className="w-5 h-5 mr-2" />
                      Démarrer la course
                    </>
                  )}
                  {activeRide.status === 'in_progress' && (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Terminer la course
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stats cards */}
          {!activeRide && !pendingRide && (
            <>
              {/* Today's summary */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Aujourd'hui</h3>
                    <Badge variant="secondary">{new Date().toLocaleDateString('fr-FR', { weekday: 'long' })}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-500/10 rounded-xl">
                      <Wallet className="w-6 h-6 mx-auto mb-1 text-green-600" />
                      <p className="text-2xl font-bold text-green-600">{stats.todayEarnings.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">FCFA gagnés</p>
                    </div>
                    <div className="text-center p-3 bg-primary/10 rounded-xl">
                      <Car className="w-6 h-6 mx-auto mb-1 text-primary" />
                      <p className="text-2xl font-bold text-primary">{stats.todayTrips}</p>
                      <p className="text-xs text-muted-foreground">courses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly stats */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-semibold">Cette semaine</p>
                        <p className="text-sm text-muted-foreground">{stats.weekEarnings.toLocaleString()} FCFA</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col"
                  onClick={() => navigate('/driver/planning')}
                >
                  <Clock className="w-6 h-6 mb-2 text-primary" />
                  <span>Mes horaires</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col"
                  onClick={() => navigate('/history')}
                >
                  <Users className="w-6 h-6 mb-2 text-primary" />
                  <span>Historique</span>
                </Button>
              </div>

              {/* Offline message */}
              {!isOnline && (
                <div className="text-center py-8">
                  <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Passez en ligne pour recevoir des courses</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom nav for driver */}
        <div className="p-4 border-t bg-background">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/')}
          >
            Retour mode passager
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default DriverDashboard;

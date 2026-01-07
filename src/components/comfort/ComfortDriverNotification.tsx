import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Navigation, 
  Clock, 
  Banknote, 
  MapPin, 
  User,
  Check,
  X,
  Route,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewPassengerRequest {
  id: string;
  clientName: string;
  pickupLocation: string;
  pickupCoords: { lat: number; lng: number };
  destination: string;
  detourMinutes: number;
  additionalEarnings: number;
  seatPreference: 'any' | 'front' | 'back-alone';
}

interface ComfortDriverNotificationProps {
  request: NewPassengerRequest;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  className?: string;
}

export const ComfortDriverNotification = ({
  request,
  onAccept,
  onReject,
  className,
}: ComfortDriverNotificationProps) => {
  const [countdown, setCountdown] = useState(20);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Son de notification
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.play().catch(() => {});
    
    // Vibration
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onReject(request.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      audioRef.current?.pause();
    };
  }, [request.id, onReject]);

  const getSeatPreferenceLabel = (pref: string) => {
    switch (pref) {
      case 'front': return 'Place avant demandée';
      case 'back-alone': return 'Banquette seule';
      default: return 'Flexible';
    }
  };

  return (
    <Card className={cn(
      "overflow-hidden border-2 border-violet-500 shadow-xl shadow-violet-500/20",
      "animate-in slide-in-from-top-4 duration-300",
      className
    )}>
      {/* Header avec animation */}
      <div className="relative px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white">
        <div className="absolute inset-0 bg-white/10 animate-pulse" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold">Nouveau passager sur votre route</p>
              <p className="text-xs text-white/80">+{request.detourMinutes} min de détour</p>
            </div>
          </div>
          
          {/* Timer */}
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">{countdown}</span>
            <span className="text-[10px] text-white/70">secondes</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Client info */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center">
            <User className="w-6 h-6 text-violet-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{request.clientName}</p>
            <p className="text-xs text-muted-foreground">{getSeatPreferenceLabel(request.seatPreference)}</p>
          </div>
        </div>

        {/* Route modification */}
        <div className="p-3 rounded-xl bg-muted/50 space-y-2">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
              <div className="w-0.5 h-6 bg-gradient-to-b from-violet-500 to-primary" />
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Nouveau point de ramassage</p>
                <p className="text-sm font-medium">{request.pickupLocation}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Sa destination</p>
                <p className="text-sm font-medium">{request.destination}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gains et détour */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
              <Banknote className="w-4 h-4" />
              <span className="text-xs font-medium">Gain supplémentaire</span>
            </div>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              +{request.additionalEarnings.toLocaleString()} F
            </p>
          </div>
          
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Détour estimé</span>
            </div>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
              +{request.detourMinutes} min
            </p>
          </div>
        </div>

        {/* Info GPS */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
          <Navigation className="w-3.5 h-3.5 text-violet-500" />
          <span>La navigation sera mise à jour automatiquement si vous acceptez</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={() => onReject(request.id)}
          >
            <X className="w-4 h-4 mr-2" />
            Ignorer
          </Button>
          <Button
            className="flex-1 h-12 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            onClick={() => onAccept(request.id)}
          >
            <Check className="w-4 h-4 mr-2" />
            Accepter
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Mini notification dans la carte du chauffeur
export const ComfortRouteUpdate = ({
  waypointName,
  eta,
  onNavigate,
}: {
  waypointName: string;
  eta: number;
  onNavigate: () => void;
}) => {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
      <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center">
        <MapPin className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">Nouveau point de ramassage</p>
        <p className="text-xs text-muted-foreground">{waypointName} • {eta} min</p>
      </div>
      <Button 
        size="sm" 
        className="bg-violet-500 hover:bg-violet-600"
        onClick={onNavigate}
      >
        <Navigation className="w-4 h-4 mr-1" />
        Go
      </Button>
    </div>
  );
};

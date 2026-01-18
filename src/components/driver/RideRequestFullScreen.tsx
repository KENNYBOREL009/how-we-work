import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MapPin, Navigation, Star, Clock, X, Check, Users } from 'lucide-react';

interface RideRequest {
  id: string;
  clientName: string;
  clientAvatar?: string;
  clientRating: number;
  origin: string;
  destination: string;
  distance: string;
  duration: string;
  fare: number;
  isShared?: boolean;
  passengerCount?: number;
}

interface RideRequestFullScreenProps {
  request: RideRequest;
  timeoutSeconds?: number;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
}

export const RideRequestFullScreen = ({
  request,
  timeoutSeconds = 30,
  onAccept,
  onDecline,
}: RideRequestFullScreenProps) => {
  const [countdown, setCountdown] = useState(timeoutSeconds);
  const [isExpiring, setIsExpiring] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      onDecline(request.id);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 1;
        if (next <= 10) setIsExpiring(true);
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, onDecline, request.id]);

  // Play notification sound on mount
  useEffect(() => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}

    // Vibrate if supported
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  }, []);

  const handleAccept = useCallback(() => {
    onAccept(request.id);
  }, [onAccept, request.id]);

  const handleDecline = useCallback(() => {
    onDecline(request.id);
  }, [onDecline, request.id]);

  // Calculate countdown circle progress
  const progress = (countdown / timeoutSeconds) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header with countdown */}
      <div className="flex flex-col items-center pt-8 pb-4">
        <div className="relative w-28 h-28">
          {/* Background circle */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={isExpiring ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          {/* Countdown text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Clock className={`w-5 h-5 mb-1 ${isExpiring ? 'text-destructive animate-pulse' : 'text-primary'}`} />
            <span className={`text-3xl font-bold ${isExpiring ? 'text-destructive' : 'text-foreground'}`}>
              {countdown}
            </span>
            <span className="text-xs text-muted-foreground">secondes</span>
          </div>
        </div>
        <h2 className="text-lg font-semibold mt-4 text-foreground">Nouvelle course</h2>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        {/* Client info card */}
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary">
              <AvatarImage src={request.clientAvatar} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {request.clientName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground">{request.clientName}</h3>
              <div className="flex items-center gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(request.clientRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted'
                    }`}
                  />
                ))}
                <span className="text-sm text-muted-foreground ml-1">
                  {request.clientRating.toFixed(1)}
                </span>
              </div>
              {request.isShared && (
                <Badge variant="secondary" className="mt-2">
                  <Users className="w-3 h-3 mr-1" />
                  {request.passengerCount || 1} passager(s)
                </Badge>
              )}
            </div>
          </div>
        </Card>

        {/* Route card */}
        <Card className="p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-green-600" />
              <div className="w-0.5 h-16 bg-gradient-to-b from-green-500 to-primary" />
              <div className="w-4 h-4 rounded-full bg-primary border-2 border-primary" />
            </div>
            <div className="flex-1 space-y-3">
              {/* Pickup */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Départ</p>
                <p className="font-medium text-foreground">{request.origin}</p>
              </div>
              
              {/* Distance/Duration badge */}
              <div className="flex items-center gap-2 py-1">
                <Badge variant="outline" className="bg-muted/50">
                  <Navigation className="w-3 h-3 mr-1" />
                  {request.distance}
                </Badge>
                <Badge variant="outline" className="bg-muted/50">
                  <Clock className="w-3 h-3 mr-1" />
                  {request.duration}
                </Badge>
              </div>
              
              {/* Destination */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Destination</p>
                <p className="font-medium text-foreground">{request.destination}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Fare card */}
        <Card className="p-4 mb-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tarif estimé</p>
              <p className="text-3xl font-bold text-primary">
                {request.fare.toLocaleString()} <span className="text-lg">FCFA</span>
              </p>
            </div>
            <div className="text-5xl">💰</div>
          </div>
        </Card>
      </div>

      {/* Action buttons - Fixed at bottom */}
      <div className="p-4 pb-8 bg-background border-t">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="lg"
            className="h-14 text-lg border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleDecline}
          >
            <X className="w-5 h-5 mr-2" />
            Refuser
          </Button>
          <Button
            size="lg"
            className="h-14 text-lg bg-green-600 hover:bg-green-700 text-white"
            onClick={handleAccept}
          >
            <Check className="w-5 h-5 mr-2" />
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
};

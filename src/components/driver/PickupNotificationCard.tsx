import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Navigation, Armchair, X, Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PickupRequest {
  id: string;
  clientName: string;
  clientAvatar?: string;
  pickupDistance: number; // en mètres
  seatPreference: 'front' | 'back-window' | 'back-middle' | null;
  detourTime: number; // en minutes
  pickupLocation: string;
  isOnRoute: boolean;
  pickupLat?: number;
  pickupLng?: number;
}

interface PickupNotificationCardProps {
  request: PickupRequest;
  onAccept: () => void;
  onReject: () => void;
  className?: string;
}

// Seuils de tolérance de détour
const DETOUR_THRESHOLDS = {
  ON_ROUTE: 50,      // 0-50m: sur la route
  SMALL_DETOUR: 200, // 50-200m: petit détour (~1-2 min)
  MAX_DETOUR: 300,   // >200m: détour important
};

const seatLabels: Record<string, string> = {
  'front': 'Place Avant',
  'back-window': 'Place Fenêtre',
  'back-middle': 'Place Centre',
};

const PickupNotificationCard: React.FC<PickupNotificationCardProps> = ({
  request,
  onAccept,
  onReject,
  className,
}) => {
  const [timeLeft, setTimeLeft] = useState(30); // 30 secondes pour répondre

  // Timer et son
  useEffect(() => {
    // Son de notification
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(1600, audioContext.currentTime + 0.15);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      // Vibration
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch (e) {
      console.log('Audio non disponible');
    }

    // Countdown
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onReject();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onReject]);

  // Statut du détour
  const getDetourStatus = () => {
    if (request.pickupDistance <= DETOUR_THRESHOLDS.ON_ROUTE) {
      return { 
        status: 'on-route', 
        label: 'Sur votre route',
        bgColor: 'bg-green-500',
        textColor: 'text-green-700',
        lightBg: 'bg-green-50 dark:bg-green-950/30',
        borderColor: 'border-green-500',
      };
    } else if (request.pickupDistance <= DETOUR_THRESHOLDS.SMALL_DETOUR) {
      return { 
        status: 'small-detour', 
        label: `+${request.detourTime} min`,
        bgColor: 'bg-amber-500',
        textColor: 'text-amber-700',
        lightBg: 'bg-amber-50 dark:bg-amber-950/30',
        borderColor: 'border-amber-500',
      };
    } else {
      return { 
        status: 'large-detour', 
        label: 'Détour important',
        bgColor: 'bg-red-500',
        textColor: 'text-red-700',
        lightBg: 'bg-red-50 dark:bg-red-950/30',
        borderColor: 'border-red-500',
      };
    }
  };

  const detourInfo = getDetourStatus();

  return (
    <Card className={cn(
      "overflow-hidden border-2 shadow-xl animate-in slide-in-from-top duration-300",
      detourInfo.borderColor,
      className
    )}>
      {/* Header avec timer */}
      <div className={cn("px-4 py-3 flex items-center justify-between", detourInfo.bgColor)}>
        <div className="flex items-center gap-2 text-white">
          <div className="relative">
            <Navigation className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-pulse" />
          </div>
          <span className="font-semibold text-sm">Nouvelle demande</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            {detourInfo.label}
          </Badge>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
            timeLeft <= 10 ? "bg-red-600 text-white animate-pulse" : "bg-white/20 text-white"
          )}>
            {timeLeft}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Info client */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
            {request.clientAvatar || request.clientName.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">{request.clientName}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>À {request.pickupDistance}m</span>
              {request.seatPreference && (
                <>
                  <span>•</span>
                  <Armchair className="w-4 h-4" />
                  <span>{seatLabels[request.seatPreference]}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Lieu de pickup */}
        <div className={cn("rounded-xl p-3", detourInfo.lightBg)}>
          <div className="flex items-start gap-2">
            <MapPin className={cn("w-5 h-5 mt-0.5", detourInfo.textColor)} />
            <div>
              <p className={cn("font-medium", detourInfo.textColor)}>
                {request.pickupLocation}
              </p>
              {detourInfo.status === 'on-route' && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Client sur votre trajet
                </p>
              )}
              {detourInfo.status === 'large-detour' && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Éloigné de votre trajet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={onReject}
            className="h-14 text-lg border-2 border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <X className="w-5 h-5 mr-2" />
            Refuser
          </Button>
          <Button
            onClick={onAccept}
            className={cn(
              "h-14 text-lg",
              detourInfo.status === 'large-detour' 
                ? "bg-amber-500 hover:bg-amber-600" 
                : "bg-green-500 hover:bg-green-600"
            )}
          >
            <Check className="w-5 h-5 mr-2" />
            Accepter
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PickupNotificationCard;

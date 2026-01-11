import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Navigation,
  XCircle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateDistance, getCurrentPosition } from "@/lib/geolocation";
import { useRideAudit } from "@/hooks/useRideAudit";
import { toast } from "sonner";

interface PresenceValidationProps {
  rideId: string;
  clientLat: number;
  clientLng: number;
  onArrivalConfirmed: () => void;
  onCancelWithoutFees: () => void;
  onCancelWithPenalty: () => void;
  proximityThreshold?: number; // in meters
  timerDuration?: number; // in seconds
}

type ValidationState = 'checking' | 'in_zone' | 'out_of_zone' | 'timer_expired';

export const PresenceValidation = ({
  rideId,
  clientLat,
  clientLng,
  onArrivalConfirmed,
  onCancelWithoutFees,
  onCancelWithPenalty,
  proximityThreshold = 50,
  timerDuration = 120 // 2 minutes
}: PresenceValidationProps) => {
  const { logAction } = useRideAudit();
  const [validationState, setValidationState] = useState<ValidationState>('checking');
  const [distance, setDistance] = useState<number | null>(null);
  const [driverPosition, setDriverPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(timerDuration);
  const [timerStarted, setTimerStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check driver's position
  const checkPosition = useCallback(async () => {
    try {
      const position = await getCurrentPosition();
      const driverLat = position.coords.latitude;
      const driverLng = position.coords.longitude;
      setDriverPosition({ lat: driverLat, lng: driverLng });

      const dist = calculateDistance(driverLat, driverLng, clientLat, clientLng);
      setDistance(Math.round(dist));

      const isInZone = dist <= proximityThreshold;
      
      if (isInZone) {
        setValidationState('in_zone');
        // Log zone validation
        await logAction({
          rideId,
          actionType: 'ZONE_VALIDATED',
          driverLat,
          driverLng,
          clientLat,
          clientLng,
          distanceMeters: Math.round(dist),
          metadata: { threshold: proximityThreshold }
        });
      } else {
        setValidationState('out_of_zone');
        // Log moved away if previously in zone
        await logAction({
          rideId,
          actionType: 'MOVED_AWAY',
          driverLat,
          driverLng,
          clientLat,
          clientLng,
          distanceMeters: Math.round(dist)
        });
      }

      return { isInZone, driverLat, driverLng, dist };
    } catch (error) {
      console.error('Failed to get position:', error);
      toast.error("Impossible d'accéder à votre position GPS");
      return null;
    }
  }, [clientLat, clientLng, proximityThreshold, rideId, logAction]);

  // Handle "I've arrived" button
  const handleArrivalClick = async () => {
    setIsLoading(true);
    
    const result = await checkPosition();
    
    if (result) {
      // Log arrival attempt
      await logAction({
        rideId,
        actionType: 'ARRIVED',
        driverLat: result.driverLat,
        driverLng: result.driverLng,
        clientLat,
        clientLng,
        distanceMeters: Math.round(result.dist)
      });

      if (result.isInZone) {
        // Start timer
        setTimerStarted(true);
        await logAction({
          rideId,
          actionType: 'TIMER_START',
          driverLat: result.driverLat,
          driverLng: result.driverLng,
          clientLat,
          clientLng,
          distanceMeters: Math.round(result.dist),
          metadata: { duration: timerDuration }
        });
        toast.success("Zone client validée ! En attente du client...");
      } else {
        toast.error(`Vous êtes à ${Math.round(result.dist)}m du client. Rapprochez-vous pour valider.`);
      }
    }

    setIsLoading(false);
  };

  // Timer countdown
  useEffect(() => {
    if (!timerStarted) return;

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setValidationState('timer_expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerStarted]);

  // Handle cancel with appropriate fees
  const handleCancel = async () => {
    if (validationState === 'in_zone' && secondsLeft > 0) {
      // Penalty warning - driver cancelling in zone before timer expires
      await logAction({
        rideId,
        actionType: 'PENALTY_WARNING',
        driverLat: driverPosition?.lat,
        driverLng: driverPosition?.lng,
        clientLat,
        clientLng,
        distanceMeters: distance || undefined,
        metadata: { timer_remaining: secondsLeft }
      });
      
      toast.error(
        "⚠️ Attention, pénalité pour annulation abusive en zone client",
        { duration: 5000 }
      );
      onCancelWithPenalty();
    } else if (validationState === 'timer_expired') {
      // No penalty - timer expired
      await logAction({
        rideId,
        actionType: 'NO_SHOW',
        driverLat: driverPosition?.lat,
        driverLng: driverPosition?.lng,
        clientLat,
        clientLng,
        distanceMeters: distance || undefined,
        metadata: { timer_expired: true }
      });
      onCancelWithoutFees();
    } else {
      onCancelWithPenalty();
    }
  };

  // Client confirmed pickup
  const handleClientConfirmed = async () => {
    await logAction({
      rideId,
      actionType: 'CLIENT_CONFIRMED',
      driverLat: driverPosition?.lat,
      driverLng: driverPosition?.lng,
      clientLat,
      clientLng,
      distanceMeters: distance || undefined
    });
    onArrivalConfirmed();
  };

  const progressPercent = (secondsLeft / timerDuration) * 100;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  if (!timerStarted) {
    return (
      <div className="p-4 bg-muted/50 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            <span className="font-semibold">Validation de présence</span>
          </div>
          {distance !== null && (
            <Badge variant={validationState === 'in_zone' ? 'default' : 'secondary'}>
              {distance}m du client
            </Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Appuyez sur "Je suis arrivé" quand vous êtes au point de récupération.
          Votre position GPS sera vérifiée.
        </p>

        <Button 
          className="w-full h-14 text-base"
          onClick={handleArrivalClick}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Vérification GPS...
            </>
          ) : (
            <>
              <MapPin className="w-5 h-5 mr-2" />
              Je suis arrivé
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl space-y-4 border-2 border-green-500 bg-green-500/5">
      {/* Zone validation badge */}
      <div className="flex items-center justify-between">
        <Badge className="bg-green-500 text-white gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Zone Client Validée
        </Badge>
        {distance !== null && (
          <span className="text-sm text-muted-foreground">{distance}m</span>
        )}
      </div>

      {/* Timer display */}
      {validationState !== 'timer_expired' ? (
        <>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Temps d'attente client
            </p>
            <p className={cn(
              "text-4xl font-mono font-bold",
              secondsLeft <= 30 ? "text-destructive" : "text-foreground"
            )}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </p>
            <Progress 
              value={progressPercent} 
              className={cn(
                "mt-3 h-2",
                secondsLeft <= 30 && "[&>div]:bg-destructive"
              )}
            />
          </div>

          <Button 
            className="w-full h-14 text-base"
            onClick={handleClientConfirmed}
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Client à bord - Démarrer
          </Button>

          {secondsLeft <= 30 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Le temps s'écoule. Annulation sans frais possible bientôt.
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center mb-3">
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
            <p className="font-semibold text-lg">Temps d'attente écoulé</p>
            <p className="text-sm text-muted-foreground">
              Le client ne s'est pas présenté
            </p>
          </div>

          <Button 
            className="w-full h-14 text-base"
            variant="outline"
            onClick={handleCancel}
          >
            <XCircle className="w-5 h-5 mr-2" />
            Annuler sans frais
          </Button>
        </>
      )}
    </div>
  );
};

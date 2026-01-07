import { useState, useEffect } from "react";
import { AlertTriangle, Clock, CheckCircle, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ArrivalCountdownProps {
  driverName: string;
  vehiclePlate: string;
  initialSeconds?: number;
  onConfirmBoarding: () => void;
  onTimeout: () => void;
  onCancel: () => void;
}

export const ArrivalCountdown = ({
  driverName,
  vehiclePlate,
  initialSeconds = 60,
  onConfirmBoarding,
  onTimeout,
  onCancel,
}: ArrivalCountdownProps) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) {
      setIsExpired(true);
      onTimeout();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onTimeout]);

  const progressPercent = (secondsLeft / initialSeconds) * 100;
  const isUrgent = secondsLeft <= 15;

  if (isExpired) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-card border border-destructive/50 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-destructive">Temps écoulé</h2>
          <p className="text-muted-foreground">
            Vous n'avez pas confirmé votre montée à temps. 
            Une pénalité sera appliquée selon les conditions.
          </p>
          <Button variant="outline" className="w-full" onClick={onCancel}>
            Fermer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border rounded-2xl p-6 max-w-sm w-full space-y-6 shadow-2xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className={cn(
            "w-20 h-20 mx-auto rounded-full flex items-center justify-center transition-colors",
            isUrgent ? "bg-destructive/20 animate-pulse" : "bg-primary/20"
          )}>
            <Car className={cn(
              "h-10 w-10",
              isUrgent ? "text-destructive" : "text-primary"
            )} />
          </div>
          <h2 className="text-xl font-bold">Le chauffeur vous attend</h2>
          <p className="text-muted-foreground text-sm">
            {driverName} • {vehiclePlate}
          </p>
        </div>

        {/* Countdown */}
        <div className="text-center space-y-3">
          <div className={cn(
            "text-5xl font-mono font-bold transition-colors",
            isUrgent ? "text-destructive animate-pulse" : "text-foreground"
          )}>
            {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:
            {String(secondsLeft % 60).padStart(2, '0')}
          </div>
          <Progress 
            value={progressPercent} 
            className={cn(
              "h-2 transition-all",
              isUrgent && "[&>div]:bg-destructive"
            )}
          />
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" />
            Temps restant pour confirmer votre montée
          </p>
        </div>

        {/* Warning */}
        {isUrgent && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-center">
            <p className="text-destructive text-sm font-medium">
              ⚠️ Attention ! Une pénalité sera appliquée si vous ne confirmez pas.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            className="w-full h-14 text-lg font-semibold gap-2"
            onClick={onConfirmBoarding}
          >
            <CheckCircle className="h-5 w-5" />
            Je suis à bord
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground"
            onClick={onCancel}
          >
            Annuler la course
          </Button>
        </div>
      </div>
    </div>
  );
};

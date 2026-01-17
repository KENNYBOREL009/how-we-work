import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MapPin, Navigation, User, Clock, Check, X, Loader2 } from "lucide-react";
import { useDriverMatching } from "@/hooks/useDriverMatching";
import { SurgePricingBadge } from "@/components/surge/SurgePricingBadge";
import { cn } from "@/lib/utils";

interface RideRequestNotification {
  requestId: string;
  origin: string;
  destination: string;
  fare: number;
  surgeMultiplier: number;
  timeoutSeconds: number;
}

interface DriverMatchingNotificationProps {
  request: RideRequestNotification;
  onAccept: () => void;
  onDecline: () => void;
}

export const DriverMatchingNotification = ({
  request,
  onAccept,
  onDecline
}: DriverMatchingNotificationProps) => {
  const [countdown, setCountdown] = useState(request.timeoutSeconds);
  const [isResponding, setIsResponding] = useState(false);
  const { respondToRequest } = useDriverMatching();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleTimeout = async () => {
    await respondToRequest(request.requestId, 'decline');
    onDecline();
  };

  const handleAccept = async () => {
    setIsResponding(true);
    const success = await respondToRequest(request.requestId, 'accept');
    if (success) {
      onAccept();
    }
    setIsResponding(false);
  };

  const handleDecline = async () => {
    setIsResponding(true);
    await respondToRequest(request.requestId, 'decline');
    onDecline();
    setIsResponding(false);
  };

  const progress = (countdown / request.timeoutSeconds) * 100;

  return (
    <Card className={cn(
      "fixed top-4 left-4 right-4 z-50 border-2 shadow-2xl",
      countdown <= 10 ? "border-destructive animate-pulse" : "border-primary"
    )}>
      <CardContent className="p-4 space-y-4">
        {/* Timer */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Nouvelle course
            </span>
            <span className={cn(
              "font-bold",
              countdown <= 10 && "text-destructive"
            )}>
              {countdown}s
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Route info */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-green-500 mt-1 shrink-0" />
            <span className="text-sm">{request.origin}</span>
          </div>
          <div className="flex items-start gap-2">
            <Navigation className="w-4 h-4 text-primary mt-1 shrink-0" />
            <span className="text-sm">{request.destination}</span>
          </div>
        </div>

        {/* Fare with surge */}
        <div className="flex items-center justify-between bg-muted rounded-lg p-3">
          <div>
            <p className="text-sm text-muted-foreground">Tarif</p>
            <p className="text-xl font-bold">{request.fare.toLocaleString()} FCFA</p>
          </div>
          {request.surgeMultiplier > 1 && (
            <SurgePricingBadge multiplier={request.surgeMultiplier} />
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handleDecline}
            disabled={isResponding}
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            {isResponding ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <X className="w-5 h-5 mr-2" />
                Refuser
              </>
            )}
          </Button>
          <Button
            size="lg"
            onClick={handleAccept}
            disabled={isResponding}
            className="bg-green-600 hover:bg-green-700"
          >
            {isResponding ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Accepter
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

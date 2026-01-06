import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Car, MapPin, CheckCircle2, User } from "lucide-react";

interface DriverSearchAnimationProps {
  destination: string;
  onComplete: () => void;
}

export const DriverSearchAnimation = ({ destination, onComplete }: DriverSearchAnimationProps) => {
  const [step, setStep] = useState(0);
  const [foundDriver, setFoundDriver] = useState(false);

  const steps = [
    "Recherche de chauffeurs à proximité...",
    "Analyse des disponibilités...",
    "Chauffeur trouvé !",
  ];

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    timers.push(setTimeout(() => setStep(1), 1500));
    timers.push(setTimeout(() => {
      setStep(2);
      setFoundDriver(true);
    }, 3000));
    timers.push(setTimeout(() => onComplete(), 4500));

    return () => timers.forEach(t => clearTimeout(t));
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      {/* Animated car with radar */}
      <div className="relative mb-8">
        {/* Radar rings */}
        <div className={cn(
          "absolute inset-0 rounded-full border-2 border-primary/30 animate-ping",
          foundDriver && "hidden"
        )} style={{ animationDuration: "1.5s" }} />
        <div className={cn(
          "absolute inset-[-20px] rounded-full border border-primary/20 animate-ping",
          foundDriver && "hidden"
        )} style={{ animationDuration: "2s", animationDelay: "0.5s" }} />
        <div className={cn(
          "absolute inset-[-40px] rounded-full border border-primary/10 animate-ping",
          foundDriver && "hidden"
        )} style={{ animationDuration: "2.5s", animationDelay: "1s" }} />
        
        {/* Center icon */}
        <div className={cn(
          "relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500",
          foundDriver 
            ? "bg-lokebo-success scale-110" 
            : "bg-primary"
        )}>
          {foundDriver ? (
            <CheckCircle2 className="w-12 h-12 text-white animate-scale-in" />
          ) : (
            <Car className="w-12 h-12 text-primary-foreground animate-pulse" />
          )}
        </div>
      </div>

      {/* Status text */}
      <p className={cn(
        "text-lg font-semibold text-center mb-2 transition-colors",
        foundDriver ? "text-lokebo-success" : "text-foreground"
      )}>
        {steps[step]}
      </p>

      {/* Destination reminder */}
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <MapPin className="w-4 h-4" />
        <span>{destination}</span>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2 mt-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              step >= i 
                ? foundDriver && step === 2 
                  ? "bg-lokebo-success scale-125" 
                  : "bg-primary scale-110" 
                : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Driver card preview when found */}
      {foundDriver && (
        <div className="mt-8 w-full animate-slide-up">
          <div className="p-4 rounded-2xl bg-card border border-border shadow-medium">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
                <User className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">Jean-Pierre M.</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Toyota Corolla</span>
                  <span>•</span>
                  <span>⭐ 4.8</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">3 min</p>
                <p className="text-xs text-muted-foreground">Arrivée</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { cn } from "@/lib/utils";
import { Calendar, Users, Crown, Check } from "lucide-react";

export type RideMode = "reservation" | "confort-partage" | "privatisation";

export interface RideModeOption {
  id: RideMode;
  name: string;
  shortName: string;
  description: string;
  icon: typeof Calendar;
  basePrice: number;
  pricePerKm: number;
  maxPassengers?: number;
  isShared?: boolean;
  isPremium?: boolean;
  eta: string;
}

export const rideModes: RideModeOption[] = [
  {
    id: "reservation",
    name: "Réservation Place",
    shortName: "Réserver",
    description: "Réservez une place dans un taxi",
    icon: Calendar,
    basePrice: 100,
    pricePerKm: 100,
    eta: "5-10 min",
  },
  {
    id: "confort-partage",
    name: "Confort Partagé",
    shortName: "Partagé",
    description: "Prix divisé jusqu'à 4",
    icon: Users,
    basePrice: 1000,
    pricePerKm: 200,
    maxPassengers: 4,
    isShared: true,
    eta: "5-8 min",
  },
  {
    id: "privatisation",
    name: "Privatisation",
    shortName: "VTC Privé",
    description: "Service exclusif • véhicule au choix",
    icon: Crown,
    basePrice: 2000,
    pricePerKm: 250,
    eta: "3-7 min",
    isPremium: true,
  },
];

interface RideOptionsProps {
  selectedMode: RideMode | null;
  onSelect: (mode: RideMode) => void;
  distance: number;
  passengerCount?: number;
}

export const RideOptions = ({ selectedMode, onSelect, distance, passengerCount = 1 }: RideOptionsProps) => {
  const calculatePrice = (mode: RideModeOption) => {
    const baseTotal = mode.basePrice + Math.round(distance * mode.pricePerKm);
    if (mode.isShared && passengerCount > 1) {
      return Math.round(baseTotal / passengerCount);
    }
    return baseTotal;
  };

  return (
    <div className="space-y-2">
      {rideModes.map((mode) => {
        const Icon = mode.icon;
        const isSelected = selectedMode === mode.id;
        const price = calculatePrice(mode);
        
        return (
          <button
            key={mode.id}
            onClick={() => onSelect(mode.id)}
            className={cn(
              "w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left relative overflow-hidden",
              isSelected
                ? mode.isPremium 
                  ? "border-amber-500 bg-gradient-to-r from-amber-500/10 to-orange-500/10"
                  : "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50"
            )}
          >
            {/* Premium badge */}
            {mode.isPremium && (
              <div className="absolute top-0 right-0 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold rounded-bl-lg">
                PREMIUM
              </div>
            )}
            
            {/* Selection indicator */}
            {isSelected && (
              <div className={cn(
                "absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center",
                mode.isPremium ? "bg-amber-500" : "bg-primary"
              )}>
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
                isSelected 
                  ? mode.isPremium 
                    ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white" 
                    : "bg-primary text-primary-foreground" 
                  : "bg-muted text-foreground"
              )}>
                <Icon className="w-7 h-7" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <h3 className={cn(
                    "font-bold",
                    mode.isPremium && isSelected ? "text-amber-700 dark:text-amber-400" : "text-foreground"
                  )}>{mode.name}</h3>
                  <span className="text-xs text-muted-foreground">{mode.eta}</span>
                </div>
                <p className="text-sm text-muted-foreground">{mode.description}</p>
              </div>
              
              <div className="text-right shrink-0">
                <p className={cn(
                  "text-lg font-bold",
                  mode.isPremium && isSelected ? "text-amber-700 dark:text-amber-400" : "text-foreground"
                )}>
                  {price > 0 ? `${price.toLocaleString()}` : "Gratuit"}
                </p>
                {price > 0 && <p className="text-xs text-muted-foreground">FCFA</p>}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

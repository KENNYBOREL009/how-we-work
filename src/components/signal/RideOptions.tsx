import { cn } from "@/lib/utils";
import { Car, Users, Crown, Check, Sparkles, TrendingDown } from "lucide-react";

export type RideMode = "reservation" | "confort-partage" | "privatisation";

export interface RideModeOption {
  id: RideMode;
  name: string;
  shortName: string;
  description: string;
  icon: typeof Car;
  basePrice: number;
  pricePerKm: number;
  maxPassengers?: number;
  isShared?: boolean;
  isPremium?: boolean;
  isDefault?: boolean;
  badge?: string;
  badgeColor?: string;
  eta: string;
}

export const rideModes: RideModeOption[] = [
  {
    id: "reservation",
    name: "Course Standard",
    shortName: "Standard",
    description: "Taxi jaune • Rapide et fiable",
    icon: Car,
    basePrice: 100,
    pricePerKm: 100,
    eta: "5-10 min",
    isDefault: true,
    badge: "Recommandé",
    badgeColor: "bg-primary text-primary-foreground",
  },
  {
    id: "confort-partage",
    name: "Confort Partagé",
    shortName: "Partagé",
    description: "VTC partagé • Prix divisé jusqu'à 4",
    icon: Users,
    basePrice: 1000,
    pricePerKm: 200,
    maxPassengers: 4,
    isShared: true,
    eta: "5-8 min",
    badge: "Économique",
    badgeColor: "bg-violet-500 text-white",
  },
  {
    id: "privatisation",
    name: "VTC Premium",
    shortName: "Premium",
    description: "Véhicule privé • Service exclusif",
    icon: Crown,
    basePrice: 2000,
    pricePerKm: 250,
    eta: "3-7 min",
    isPremium: true,
    badge: "Luxe",
    badgeColor: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
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
    <div className="space-y-3">
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
                  ? "border-amber-500 bg-gradient-to-r from-amber-500/10 to-orange-500/10 shadow-lg"
                  : mode.isShared
                    ? "border-violet-500 bg-violet-500/10 shadow-lg"
                    : "border-primary bg-primary/5 shadow-lg"
                : "border-border bg-card hover:border-primary/50",
              mode.isDefault && !selectedMode && "ring-2 ring-primary/20"
            )}
          >
            {/* Badge */}
            {mode.badge && (
              <div className={cn(
                "absolute top-0 right-0 px-2.5 py-1 text-[10px] font-bold rounded-bl-xl flex items-center gap-1",
                mode.badgeColor
              )}>
                {mode.isShared && <TrendingDown className="w-3 h-3" />}
                {mode.isPremium && <Sparkles className="w-3 h-3" />}
                {mode.badge}
              </div>
            )}
            
            {/* Selection indicator */}
            {isSelected && (
              <div className={cn(
                "absolute bottom-3 right-3 w-6 h-6 rounded-full flex items-center justify-center",
                mode.isPremium ? "bg-amber-500" : mode.isShared ? "bg-violet-500" : "bg-primary"
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
                    : mode.isShared
                      ? "bg-violet-500 text-white"
                      : "bg-primary text-primary-foreground" 
                  : "bg-muted text-foreground"
              )}>
                <Icon className="w-7 h-7" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <h3 className={cn(
                    "font-bold",
                    mode.isPremium && isSelected && "text-amber-700 dark:text-amber-400",
                    mode.isShared && isSelected && "text-violet-700 dark:text-violet-400"
                  )}>{mode.name}</h3>
                  <span className="text-xs text-muted-foreground">{mode.eta}</span>
                </div>
                <p className="text-sm text-muted-foreground">{mode.description}</p>
              </div>
              
              <div className="text-right shrink-0 pr-1">
                <p className={cn(
                  "text-xl font-bold",
                  mode.isPremium && isSelected && "text-amber-700 dark:text-amber-400",
                  mode.isShared && isSelected && "text-violet-700 dark:text-violet-400"
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

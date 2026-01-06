import { useState } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Radio, 
  Hand, 
  Calendar, 
  Users, 
  Crown,
  ChevronRight,
  MapPin,
  Clock,
  Zap
} from "lucide-react";

type TaxiMode = "ligne-visuelle" | "reservation" | "confort-partage" | "privatisation";

interface TaxiModeOption {
  id: TaxiMode;
  name: string;
  description: string;
  icon: typeof Hand;
  price: string;
  color: string;
}

const taxiModes: TaxiModeOption[] = [
  {
    id: "ligne-visuelle",
    name: "Ligne Visuelle",
    description: "Hélez un taxi en temps réel",
    icon: Hand,
    price: "Gratuit",
    color: "bg-lokebo-success",
  },
  {
    id: "reservation",
    name: "Réservation Place",
    description: "Réservez votre siège à l'avance",
    icon: Calendar,
    price: "100 FCFA",
    color: "bg-primary",
  },
  {
    id: "confort-partage",
    name: "Confort Partagé",
    description: "VTC partagé, trajet premium",
    icon: Users,
    price: "Variable",
    color: "bg-lokebo-warning",
  },
  {
    id: "privatisation",
    name: "Privatisation",
    description: "VTC exclusif, tout le véhicule",
    icon: Crown,
    price: "Sur devis",
    color: "bg-lokebo-dark",
  },
];

const Signal = () => {
  const [selectedMode, setSelectedMode] = useState<TaxiMode | null>(null);

  return (
    <MobileLayout>
      {/* Header */}
      <header className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl gradient-lokebo flex items-center justify-center elevated">
            <Radio className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Signal</h1>
            <p className="text-sm text-muted-foreground">
              Choisissez votre mode de transport
            </p>
          </div>
        </div>
      </header>

      {/* Quick Info */}
      <div className="mx-4 mb-4 p-3 rounded-xl bg-accent border border-primary/20 flex items-center gap-3">
        <Zap className="w-5 h-5 text-primary flex-shrink-0" />
        <p className="text-sm text-foreground">
          Émettez votre intention pour attirer les chauffeurs à proximité.
        </p>
      </div>

      {/* Taxi Modes */}
      <div className="px-4 space-y-3 flex-1">
        {taxiModes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          
          return (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={cn(
                "w-full p-4 rounded-2xl border-2 transition-all duration-200 hover-scale text-left",
                isSelected
                  ? "border-primary bg-accent card-shadow"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
                  mode.color,
                  mode.id === "privatisation" ? "text-primary" : "text-primary-foreground"
                )}>
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-foreground">{mode.name}</h3>
                    <span className={cn(
                      "text-sm font-semibold px-2 py-0.5 rounded-full",
                      mode.price === "Gratuit" 
                        ? "bg-lokebo-success/20 text-lokebo-success" 
                        : "bg-primary/20 text-primary"
                    )}>
                      {mode.price}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{mode.description}</p>
                </div>
                <ChevronRight className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform",
                  isSelected ? "text-primary rotate-90" : "text-muted-foreground"
                )} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Action */}
      {selectedMode && (
        <div className="px-4 py-4 glass border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>Position actuelle</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>~5 min</span>
            </div>
          </div>
          <Button className="w-full h-14 text-lg font-bold rounded-xl elevated">
            <Radio className="w-5 h-5 mr-2 animate-pulse" />
            Émettre le Signal
          </Button>
        </div>
      )}
    </MobileLayout>
  );
};

export default Signal;

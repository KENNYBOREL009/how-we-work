import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Zap,
  Search,
  ArrowRight,
  Car,
  Loader2,
  CheckCircle2,
  X
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Vehicle } from "@/hooks/useVehicles";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TaxiMode = "ligne-visuelle" | "reservation" | "confort-partage" | "privatisation";
type Step = "mode" | "destination" | "confirm";

interface TaxiModeOption {
  id: TaxiMode;
  name: string;
  description: string;
  icon: typeof Hand;
  basePrice: number;
  priceLabel: string;
  color: string;
  pricePerKm: number;
}

const taxiModes: TaxiModeOption[] = [
  {
    id: "ligne-visuelle",
    name: "Ligne Visuelle",
    description: "Hélez un taxi en temps réel",
    icon: Hand,
    basePrice: 0,
    priceLabel: "Gratuit",
    color: "bg-lokebo-success",
    pricePerKm: 100,
  },
  {
    id: "reservation",
    name: "Réservation Place",
    description: "Réservez votre siège à l'avance",
    icon: Calendar,
    basePrice: 100,
    priceLabel: "100 FCFA",
    color: "bg-primary",
    pricePerKm: 100,
  },
  {
    id: "confort-partage",
    name: "Confort Partagé",
    description: "VTC partagé, trajet premium",
    icon: Users,
    basePrice: 500,
    priceLabel: "À partir de 500 FCFA",
    color: "bg-lokebo-warning",
    pricePerKm: 150,
  },
  {
    id: "privatisation",
    name: "Privatisation",
    description: "VTC exclusif, tout le véhicule",
    icon: Crown,
    basePrice: 2000,
    priceLabel: "À partir de 2000 FCFA",
    color: "bg-lokebo-dark",
    pricePerKm: 250,
  },
];

const popularDestinations = [
  { name: "Marché Central", distance: 2.5 },
  { name: "Akwa Palace", distance: 3.2 },
  { name: "Bonanjo", distance: 4.1 },
  { name: "Bepanda", distance: 5.0 },
  { name: "Ndokoti", distance: 6.5 },
  { name: "Bonabéri", distance: 8.0 },
  { name: "Deido", distance: 3.8 },
  { name: "New Bell", distance: 2.0 },
];

const Signal = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState<Step>("mode");
  const [selectedMode, setSelectedMode] = useState<TaxiMode | null>(null);
  const [origin, setOrigin] = useState("Ma position actuelle");
  const [destination, setDestination] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Check for pre-selected vehicle from map
  useEffect(() => {
    if (location.state?.selectedVehicle) {
      setSelectedVehicle(location.state.selectedVehicle);
      if (location.state.selectedVehicle.destination) {
        setDestination(location.state.selectedVehicle.destination);
      }
    }
  }, [location.state]);

  const calculatePrice = (mode: TaxiModeOption, distance: number) => {
    return mode.basePrice + Math.round(distance * mode.pricePerKm);
  };

  const handleModeSelect = (mode: TaxiMode) => {
    setSelectedMode(mode);
    setStep("destination");
  };

  const handleDestinationSelect = (dest: { name: string; distance: number }) => {
    setDestination(dest.name);
    const mode = taxiModes.find(m => m.id === selectedMode);
    if (mode) {
      setEstimatedPrice(calculatePrice(mode, dest.distance));
      setEstimatedTime(Math.round(dest.distance * 3)); // ~3 min per km
    }
    setStep("confirm");
  };

  const handleCustomDestination = () => {
    if (!searchQuery.trim()) return;
    setDestination(searchQuery);
    const mode = taxiModes.find(m => m.id === selectedMode);
    if (mode) {
      // Estimate 5km for custom destinations
      setEstimatedPrice(calculatePrice(mode, 5));
      setEstimatedTime(15);
    }
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!user) {
      toast.error("Veuillez vous connecter pour réserver");
      navigate("/auth");
      return;
    }

    setIsConfirming(true);

    try {
      // Create trip in database
      const { error } = await supabase.from("trips").insert({
        user_id: user.id,
        trip_type: selectedMode || "ligne-visuelle",
        origin,
        destination,
        fare: estimatedPrice,
        status: "pending",
        started_at: new Date().toISOString(),
      });

      if (error) throw error;

      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        navigate("/");
        toast.success("Signal émis avec succès!", {
          description: `Un taxi vers ${destination} arrive bientôt.`,
        });
      }, 2000);
    } catch (error) {
      console.error("Error creating trip:", error);
      toast.error("Erreur lors de la réservation");
    } finally {
      setIsConfirming(false);
    }
  };

  const filteredDestinations = popularDestinations.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMode = taxiModes.find(m => m.id === selectedMode);

  return (
    <MobileLayout>
      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6">
            <div className="w-20 h-20 rounded-full bg-lokebo-success/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-lokebo-success" />
            </div>
            <DialogTitle className="text-xl mb-2">Signal émis!</DialogTitle>
            <p className="text-muted-foreground text-center">
              Un chauffeur arrive dans environ {estimatedTime} minutes
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-lokebo flex items-center justify-center elevated">
              <Radio className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Signal</h1>
              <p className="text-sm text-muted-foreground">
                {step === "mode" && "Choisissez votre mode"}
                {step === "destination" && "Où allez-vous?"}
                {step === "confirm" && "Confirmez votre trajet"}
              </p>
            </div>
          </div>
          {step !== "mode" && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setStep(step === "confirm" ? "destination" : "mode")}
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </header>

      {/* Step Indicator */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2">
          {["mode", "destination", "confirm"].map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                ["mode", "destination", "confirm"].indexOf(step) >= i 
                  ? "bg-primary" 
                  : "bg-muted"
              )} />
            </div>
          ))}
        </div>
      </div>

      {/* Step: Mode Selection */}
      {step === "mode" && (
        <>
          {/* Selected Vehicle Info */}
          {selectedVehicle && (
            <div className="mx-4 mb-4 p-3 rounded-xl bg-accent border border-primary/20 flex items-center gap-3">
              <Car className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Taxi sélectionné: {selectedVehicle.plate_number}
                </p>
                {selectedVehicle.destination && (
                  <p className="text-xs text-muted-foreground">
                    Direction: {selectedVehicle.destination}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Quick Info */}
          <div className="mx-4 mb-4 p-3 rounded-xl bg-accent border border-primary/20 flex items-center gap-3">
            <Zap className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm text-foreground">
              Émettez votre intention pour attirer les chauffeurs à proximité.
            </p>
          </div>

          {/* Taxi Modes */}
          <div className="px-4 space-y-3 flex-1 overflow-auto">
            {taxiModes.map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedMode === mode.id;
              
              return (
                <button
                  key={mode.id}
                  onClick={() => handleModeSelect(mode.id)}
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
                          mode.basePrice === 0 
                            ? "bg-lokebo-success/20 text-lokebo-success" 
                            : "bg-primary/20 text-primary"
                        )}>
                          {mode.priceLabel}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{mode.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Step: Destination */}
      {step === "destination" && (
        <div className="px-4 flex-1 flex flex-col">
          {/* Origin/Destination */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted border border-border">
              <div className="w-8 h-8 rounded-full bg-lokebo-success flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Départ</p>
                <p className="font-medium text-foreground">{origin}</p>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Où allez-vous?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl"
                autoFocus
              />
            </div>
          </div>

          {/* Popular Destinations */}
          <div className="flex-1 overflow-auto">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Destinations populaires
            </p>
            <div className="space-y-2">
              {filteredDestinations.map((dest) => (
                <button
                  key={dest.name}
                  onClick={() => handleDestinationSelect(dest)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent transition-colors text-left"
                >
                  <MapPin className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{dest.name}</p>
                    <p className="text-xs text-muted-foreground">{dest.distance} km</p>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {currentMode && calculatePrice(currentMode, dest.distance)} FCFA
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Destination */}
          {searchQuery && !filteredDestinations.find(d => d.name.toLowerCase() === searchQuery.toLowerCase()) && (
            <div className="pt-4 border-t border-border">
              <Button 
                className="w-full h-12 rounded-xl"
                onClick={handleCustomDestination}
              >
                <MapPin className="w-5 h-5 mr-2" />
                Aller à "{searchQuery}"
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && currentMode && (
        <div className="px-4 flex-1 flex flex-col">
          {/* Trip Summary */}
          <div className="rounded-2xl border border-border bg-card p-4 mb-4">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                currentMode.color,
                currentMode.id === "privatisation" ? "text-primary" : "text-primary-foreground"
              )}>
                <currentMode.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{currentMode.name}</h3>
                <p className="text-sm text-muted-foreground">{currentMode.description}</p>
              </div>
            </div>

            {/* Route */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-lokebo-success" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Départ</p>
                  <p className="font-medium text-foreground">{origin}</p>
                </div>
              </div>
              <div className="ml-1.5 w-0.5 h-6 bg-border" />
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Destination</p>
                  <p className="font-medium text-foreground">{destination}</p>
                </div>
              </div>
            </div>

            {/* Price & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Prix estimé</p>
                <p className="text-xl font-bold text-foreground">
                  {estimatedPrice?.toLocaleString()} <span className="text-sm font-normal">FCFA</span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-muted">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Clock className="w-3 h-3" />
                  <span>Temps estimé</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  ~{estimatedTime} <span className="text-sm font-normal">min</span>
                </p>
              </div>
            </div>
          </div>

          {/* Selected Vehicle */}
          {selectedVehicle && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 mb-4">
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">{selectedVehicle.plate_number}</p>
                  <p className="text-xs text-muted-foreground">Taxi présélectionné</p>
                </div>
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Confirm Button */}
          <div className="pb-4">
            <Button
              className="w-full h-14 text-lg font-bold rounded-xl elevated"
              onClick={handleConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Confirmation...
                </>
              ) : (
                <>
                  <Radio className="w-5 h-5 mr-2 animate-pulse" />
                  Confirmer - {estimatedPrice?.toLocaleString()} FCFA
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Paiement via Wallet ou à bord
            </p>
          </div>
        </div>
      )}
    </MobileLayout>
  );
};

export default Signal;

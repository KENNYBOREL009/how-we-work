import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DestinationSearch } from "@/components/signal/DestinationSearch";
import {
  ComfortZoneIndicator,
  SeatPreferenceSelector,
  ComfortMatchResult,
  ComfortSearching,
  getSeatExtraPrice,
  type SeatPreference,
} from "@/components/comfort";
import { ChevronLeft, MapPin, Search, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type BookingStep = "zone" | "destination" | "preferences" | "searching" | "result";

interface Destination {
  name: string;
  distance: number;
}

const PRICE_PER_KM = 200;
const BASE_PRICE = 1000;

const SharedComfortBooking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState<BookingStep>("zone");
  const [destination, setDestination] = useState<Destination | null>(null);
  const [seatPreference, setSeatPreference] = useState<SeatPreference>("any");
  const [showDestinationSearch, setShowDestinationSearch] = useState(false);

  // Simulation d'un chauffeur trouvé
  const mockDriver = {
    id: "drv-001",
    name: "Paul Kamdem",
    rating: 4.8,
    vehicleModel: "Toyota Camry",
    plateNumber: "LT 2847 C",
    eta: 4,
  };

  const calculatePrice = () => {
    if (!destination) return 0;
    const baseTotal = BASE_PRICE + Math.round(destination.distance * PRICE_PER_KM);
    const seatExtra = getSeatExtraPrice(seatPreference);
    return baseTotal + seatExtra;
  };

  const getOriginalPrice = () => {
    if (!destination) return 0;
    // Prix "normal" sans partage (50% plus cher)
    return Math.round(calculatePrice() * 1.5);
  };

  const handleDestinationSelect = (dest: Destination) => {
    setDestination(dest);
    setShowDestinationSearch(false);
    setStep("preferences");
  };

  const handleSearch = () => {
    if (!user) {
      toast.error("Connexion requise", {
        description: "Veuillez vous connecter pour continuer",
        action: {
          label: "Se connecter",
          onClick: () => navigate("/auth"),
        },
      });
      return;
    }

    if (!destination) {
      toast.error("Destination requise");
      return;
    }

    setStep("searching");

    // Simulation de recherche (3-6 secondes)
    setTimeout(() => {
      setStep("result");
    }, 4000 + Math.random() * 2000);
  };

  const handleAcceptMatch = () => {
    toast.success("Trajet confirmé !", {
      description: `${mockDriver.name} arrive dans ${mockDriver.eta} minutes`,
    });
    navigate("/trip", {
      state: {
        origin: "Ma position",
        destination: destination?.name,
        fare: calculatePrice(),
        tripType: "confort-partage",
        driver: mockDriver,
        isShared: true,
      },
    });
  };

  const handleDeclineMatch = () => {
    toast.info("Recherche annulée");
    setStep("preferences");
  };

  const handleBack = () => {
    switch (step) {
      case "destination":
        setShowDestinationSearch(false);
        setStep("zone");
        break;
      case "preferences":
        setStep("zone");
        setDestination(null);
        break;
      case "searching":
      case "result":
        setStep("preferences");
        break;
      default:
        navigate(-1);
    }
  };

  // Écran de recherche
  if (step === "searching") {
    return (
      <MobileLayout showNav={false} showThemeToggle={false}>
        <div className="flex flex-col h-full bg-gradient-to-b from-violet-500/5 to-background">
          <header className="px-4 pt-4 pb-3 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">Confort Partagé</h1>
          </header>
          
          <div className="flex-1 flex items-center justify-center">
            <ComfortSearching
              destination={destination?.name || ""}
              onCancel={handleBack}
            />
          </div>
        </div>
      </MobileLayout>
    );
  }

  // Écran de résultat
  if (step === "result") {
    return (
      <MobileLayout showNav={false} showThemeToggle={false}>
        <div className="flex flex-col h-full bg-gradient-to-b from-violet-500/5 to-background">
          <header className="px-4 pt-4 pb-3 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">Proposition de trajet</h1>
          </header>
          
          <div className="flex-1 p-4">
            <ComfortMatchResult
              driver={mockDriver}
              currentPassengers={2}
              originalPrice={getOriginalPrice()}
              sharedPrice={calculatePrice()}
              pickupLocation="Votre position actuelle"
              destination={destination?.name || ""}
              detourMinutes={2}
              onAccept={handleAcceptMatch}
              onDecline={handleDeclineMatch}
            />
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showNav={false} showThemeToggle={false}>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <header className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Confort Partagé</h1>
              <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-medium">
                VTC
              </span>
            </div>
            {destination && step !== "zone" && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {destination.name}
              </p>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-6">
          {/* Zone de disponibilité (étape 1) */}
          {(step === "zone" || step === "destination") && !showDestinationSearch && (
            <>
              <ComfortZoneIndicator />
              
              {/* Champ destination */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-violet-500" />
                  Où allez-vous ?
                </h3>
                <Button
                  variant="outline"
                  className="w-full h-14 justify-start text-left border-violet-500/30 hover:border-violet-500"
                  onClick={() => {
                    setShowDestinationSearch(true);
                    setStep("destination");
                  }}
                >
                  <Search className="w-5 h-5 mr-3 text-violet-500" />
                  <span className={destination ? "text-foreground" : "text-muted-foreground"}>
                    {destination?.name || "Entrez votre destination"}
                  </span>
                </Button>
              </div>

              {/* Info sur le mode */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-violet-700 dark:text-violet-300">
                      Comment ça marche ?
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Notre algorithme trouve un véhicule allant dans votre direction. 
                      Vous partagez le trajet et divisez les frais !
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Recherche destination */}
          {showDestinationSearch && (
            <DestinationSearch onSelect={handleDestinationSelect} />
          )}

          {/* Préférences de siège (étape 2) */}
          {step === "preferences" && destination && (
            <>
              {/* Récap destination */}
              <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">{destination.name}</p>
                      <p className="text-sm text-muted-foreground">{destination.distance} km</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-violet-600"
                    onClick={() => {
                      setShowDestinationSearch(true);
                      setStep("destination");
                    }}
                  >
                    Modifier
                  </Button>
                </div>
              </div>

              {/* Sélecteur de préférence */}
              <SeatPreferenceSelector
                selected={seatPreference}
                onSelect={setSeatPreference}
              />

              {/* Avantages */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  Inclus dans votre trajet
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Véhicule climatisé", icon: "❄️" },
                    { label: "Chauffeur vérifié", icon: "✓" },
                    { label: "Assurance trajet", icon: "🛡️" },
                    { label: "Support 24/7", icon: "📞" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/30 text-sm"
                    >
                      <span>{item.icon}</span>
                      <span className="text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom CTA */}
        {step === "preferences" && destination && (
          <div className="p-4 border-t border-border bg-background">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">Prix estimé</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                    {calculatePrice().toLocaleString()} <span className="text-sm font-normal">FCFA</span>
                  </p>
                  <p className="text-sm line-through text-muted-foreground">
                    {getOriginalPrice().toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Distance</p>
                <p className="font-semibold">{destination.distance} km</p>
              </div>
            </div>
            <Button 
              className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              onClick={handleSearch}
            >
              <Search className="w-5 h-5 mr-2" />
              Trouver mon trajet partagé
            </Button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default SharedComfortBooking;

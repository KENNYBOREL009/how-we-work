import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { DestinationSearch } from "@/components/signal/DestinationSearch";
import { RideOptions, RideMode, rideModes } from "@/components/signal/RideOptions";
import { PassengerSelector } from "@/components/signal/PassengerSelector";
import { PrivateRideOptions, vehicleClasses } from "@/components/signal/PrivateRideOptions";
import { DriverSearchAnimation } from "@/components/signal/DriverSearchAnimation";
import { ChevronLeft, MapPin, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type BookingStep = "destination" | "options" | "searching";

interface Destination {
  name: string;
  distance: number;
}

const Book = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const preselectedMode = location.state?.preselectedMode as RideMode | undefined;
  
  const [step, setStep] = useState<BookingStep>("destination");
  const [destination, setDestination] = useState<Destination | null>(null);
  const [selectedMode, setSelectedMode] = useState<RideMode | null>(preselectedMode || null);
  const [passengerCount, setPassengerCount] = useState(1);
  const [selectedClass, setSelectedClass] = useState("berline");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const handleDestinationSelect = (dest: Destination) => {
    setDestination(dest);
    setStep("options");
  };

  const handleModeSelect = (mode: RideMode) => {
    setSelectedMode(mode);
  };

  const getCurrentModePrice = () => {
    if (!selectedMode || !destination) return 0;
    const mode = rideModes.find(m => m.id === selectedMode);
    if (!mode) return 0;
    
    let baseTotal = mode.basePrice + Math.round(destination.distance * mode.pricePerKm);
    
    // Pour privatisation, ajuster selon le véhicule
    if (selectedMode === "privatisation") {
      const vehicleClass = vehicleClasses.find(v => v.id === selectedClass);
      if (vehicleClass) {
        baseTotal = Math.round(baseTotal * vehicleClass.multiplier);
      }
    }
    
    return baseTotal;
  };

  const handleConfirm = () => {
    if (!user) {
      toast.error("Connexion requise", {
        description: "Veuillez vous connecter pour commander une course",
        action: {
          label: "Se connecter",
          onClick: () => navigate("/auth"),
        },
      });
      return;
    }

    setStep("searching");
  };

  const handleSearchComplete = () => {
    toast.success("Chauffeur trouvé !", {
      description: "Votre taxi arrive dans 3 minutes",
    });
    navigate("/trip", {
      state: {
        origin: "Ma position",
        destination: destination?.name,
        fare: getCurrentModePrice(),
        tripType: selectedMode,
      },
    });
  };

  const handleBack = () => {
    if (step === "options") {
      setStep("destination");
      setSelectedMode(preselectedMode || null);
    } else {
      navigate(-1);
    }
  };

  if (step === "searching") {
    return (
      <MobileLayout showNav={false} showThemeToggle={false}>
        <div className="flex flex-col h-full items-center justify-center">
          <DriverSearchAnimation
            destination={destination?.name || ""}
            onComplete={handleSearchComplete}
          />
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setStep("options")}
          >
            Annuler
          </Button>
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
            className="shrink-0"
            onClick={handleBack}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">
              {step === "destination" && "Où allons-nous ?"}
              {step === "options" && "Choisir le mode"}
            </h1>
            {destination && step !== "destination" && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {destination.name}
              </p>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {step === "destination" && (
            <DestinationSearch onSelect={handleDestinationSelect} />
          )}

          {step === "options" && destination && (
            <div className="space-y-6">
              {/* Distance info */}
              <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">{destination.name}</p>
                      <p className="text-sm text-muted-foreground">{destination.distance} km</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ride Options */}
              <RideOptions
                selectedMode={selectedMode}
                onSelect={handleModeSelect}
                distance={destination.distance}
                passengerCount={passengerCount}
              />

              {/* Passenger Selector for shared rides */}
              {selectedMode === "confort-partage" && (
                <PassengerSelector
                  count={passengerCount}
                  onChange={setPassengerCount}
                  maxPassengers={4}
                  totalPrice={getCurrentModePrice() * passengerCount}
                />
              )}

              {/* Vehicle Options for premium */}
              {selectedMode === "privatisation" && (
                <PrivateRideOptions
                  selectedClass={selectedClass}
                  onClassChange={setSelectedClass}
                  selectedServices={selectedServices}
                  onServicesChange={setSelectedServices}
                  basePrice={getCurrentModePrice()}
                />
              )}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        {step === "options" && selectedMode && (
          <div className="p-4 border-t border-border bg-background">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">Total estimé</p>
                <p className="text-2xl font-bold">
                  {getCurrentModePrice().toLocaleString()} <span className="text-sm font-normal text-muted-foreground">FCFA</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Durée estimée</p>
                <p className="font-semibold">{rideModes.find(m => m.id === selectedMode)?.eta}</p>
              </div>
            </div>
            <Button 
              className="w-full h-14 text-lg font-bold rounded-2xl"
              onClick={handleConfirm}
            >
              Commander
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Book;

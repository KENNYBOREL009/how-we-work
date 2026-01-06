import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  MapPin, 
  Clock, 
  Loader2, 
  ChevronDown,
  Car,
  X,
  ChevronLeft
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Vehicle } from "@/hooks/useVehicles";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { DestinationSearch } from "@/components/signal/DestinationSearch";
import { RideOptions, RideMode, rideModes } from "@/components/signal/RideOptions";
import { PassengerSelector } from "@/components/signal/PassengerSelector";
import { DriverSearchAnimation } from "@/components/signal/DriverSearchAnimation";

const Signal = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Core state
  const [origin] = useState("Ma position actuelle");
  const [destination, setDestination] = useState<{ name: string; distance: number } | null>(null);
  const [selectedMode, setSelectedMode] = useState<RideMode | null>(null);
  const [passengerCount, setPassengerCount] = useState(1);
  
  // UI state
  const [showDestinationDrawer, setShowDestinationDrawer] = useState(true);
  const [isSearchingDriver, setIsSearchingDriver] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Check for pre-selected vehicle or mode from navigation
  useEffect(() => {
    if (location.state?.selectedVehicle) {
      setSelectedVehicle(location.state.selectedVehicle);
      if (location.state.selectedVehicle.destination) {
        setDestination({ 
          name: location.state.selectedVehicle.destination, 
          distance: 5 
        });
        setShowDestinationDrawer(false);
      }
    }
    // Handle preselected mode from home buttons
    if (location.state?.preselectedMode) {
      setSelectedMode(location.state.preselectedMode as RideMode);
    }
  }, [location.state]);

  const handleDestinationSelect = (dest: { name: string; distance: number }) => {
    setDestination(dest);
    setShowDestinationDrawer(false);
    // Pre-select the mode if not already selected
    if (!selectedMode) {
      setSelectedMode(location.state?.preselectedMode || "reservation");
    }
  };

  const calculatePrice = () => {
    if (!selectedMode || !destination) return 0;
    const mode = rideModes.find(m => m.id === selectedMode);
    if (!mode) return 0;
    const baseTotal = mode.basePrice + Math.round(destination.distance * mode.pricePerKm);
    if (mode.isShared && passengerCount > 1) {
      return Math.round(baseTotal / passengerCount);
    }
    return baseTotal;
  };

  const getTotalPrice = () => {
    if (!selectedMode || !destination) return 0;
    const mode = rideModes.find(m => m.id === selectedMode);
    if (!mode) return 0;
    return mode.basePrice + Math.round(destination.distance * mode.pricePerKm);
  };

  const currentMode = rideModes.find(m => m.id === selectedMode);

  const handleConfirm = async () => {
    if (!destination || !selectedMode) {
      toast.error("Veuillez sélectionner une destination et un mode");
      return;
    }

    // Start the driver search animation
    setIsSearchingDriver(true);
  };

  const handleDriverFound = async () => {
    if (!user) {
      // Demo mode - just navigate
      toast.success("Course confirmée!", {
        description: `Un chauffeur vers ${destination?.name} arrive bientôt.`,
      });
      navigate("/trip");
      return;
    }

    try {
      const isSharedRide = selectedMode === "confort-partage";
      
      const { data: tripData, error } = await supabase.from("trips").insert({
        user_id: user.id,
        trip_type: selectedMode,
        origin,
        destination: destination?.name,
        fare: calculatePrice(),
        status: "pending",
        current_status: "driver_assigned",
        is_shared_ride: isSharedRide,
        started_at: new Date().toISOString(),
      }).select().single();

      if (error) throw error;

      // Pour les courses partagées, ajouter l'utilisateur comme passager
      if (isSharedRide && tripData) {
        await supabase.from("shared_ride_passengers").insert({
          trip_id: tripData.id,
          user_id: user.id,
          fare_amount: calculatePrice(),
          pickup_location: origin,
          dropoff_location: destination?.name,
        });
      }

      toast.success("Course confirmée!", {
        description: `Un chauffeur vers ${destination?.name} arrive bientôt.`,
      });
      navigate("/trip");
    } catch (error) {
      console.error("Error creating trip:", error);
      toast.error("Erreur lors de la réservation");
      setIsSearchingDriver(false);
    }
  };

  // Show driver search animation
  if (isSearchingDriver && destination) {
    return (
      <MobileLayout showNav={false} showThemeToggle={false}>
        <div className="flex-1 flex items-center justify-center bg-background">
          <DriverSearchAnimation 
            destination={destination.name}
            onComplete={handleDriverFound}
          />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showNav={false} showThemeToggle={false}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="px-4 pt-4 pb-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">Réserver une course</h1>
        </header>

        {/* Destination Card */}
        <div className="px-4 pb-3">
          <button
            onClick={() => setShowDestinationDrawer(true)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border-2 border-border hover:border-primary/50 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Destination</p>
              <p className="font-semibold text-foreground truncate">
                {destination?.name || "Où allez-vous ?"}
              </p>
            </div>
            <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
          </button>

          {/* Selected vehicle indicator */}
          {selectedVehicle && (
            <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-accent border border-primary/20">
              <Car className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Taxi: {selectedVehicle.plate_number}</p>
              </div>
              <button onClick={() => setSelectedVehicle(null)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>

        {/* Ride options - only show when destination is selected */}
        {destination && (
          <div className="flex-1 overflow-auto px-4 pb-4">
            <RideOptions
              selectedMode={selectedMode}
              onSelect={setSelectedMode}
              distance={destination.distance}
              passengerCount={passengerCount}
            />

            {/* Passenger selector for shared rides */}
            {selectedMode === "confort-partage" && (
              <div className="mt-4">
                <PassengerSelector
                  count={passengerCount}
                  onChange={setPassengerCount}
                  totalPrice={getTotalPrice()}
                />
              </div>
            )}

            {/* Trip summary */}
            {selectedMode && currentMode && (
              <div className="mt-4 p-4 rounded-2xl bg-muted/30 border border-border">
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                  <Clock className="w-4 h-4" />
                  <span>Arrivée estimée: {currentMode.eta}</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 py-1">
                    <div className="w-3 h-3 rounded-full bg-lokebo-success" />
                    <div className="w-0.5 h-10 bg-border" />
                    <div className="w-3 h-3 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Départ</p>
                      <p className="font-medium">{origin}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Destination</p>
                      <p className="font-medium">{destination.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state when no destination */}
        {!destination && (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className="w-24 h-24 rounded-3xl bg-muted flex items-center justify-center mb-6">
              <MapPin className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Où allez-vous ?</h2>
            <p className="text-muted-foreground">
              Sélectionnez votre destination pour voir les options de transport disponibles.
            </p>
          </div>
        )}

        {/* Bottom CTA */}
        {destination && selectedMode && (
          <div className="p-4 bg-background border-t border-border">
            <Button
              className="w-full h-14"
              size="lg"
              onClick={handleConfirm}
            >
              Commander • {calculatePrice().toLocaleString()} FCFA
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Paiement via Wallet ou espèces
            </p>
          </div>
        )}
      </div>

      {/* Destination Drawer */}
      <Drawer open={showDestinationDrawer} onOpenChange={setShowDestinationDrawer}>
        <DrawerContent className="h-[90vh]">
          <DrawerHeader className="pb-0">
            <DrawerTitle>Choisir une destination</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-auto px-4 pb-4">
            <DestinationSearch onSelect={handleDestinationSelect} />
          </div>
        </DrawerContent>
      </Drawer>
    </MobileLayout>
  );
};

export default Signal;

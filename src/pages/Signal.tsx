import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  MapPin, 
  Clock, 
  Radio, 
  Loader2, 
  CheckCircle2, 
  ChevronDown,
  Car,
  X
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Vehicle } from "@/hooks/useVehicles";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { DestinationSearch } from "@/components/signal/DestinationSearch";
import { RideOptions, RideMode, rideModes } from "@/components/signal/RideOptions";
import { PassengerSelector } from "@/components/signal/PassengerSelector";

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
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
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
  const estimatedTime = destination ? Math.round(destination.distance * 3) : 0;

  const handleConfirm = async () => {
    if (!user) {
      toast.error("Veuillez vous connecter pour réserver");
      navigate("/auth");
      return;
    }

    if (!destination || !selectedMode) {
      toast.error("Veuillez sélectionner une destination et un mode");
      return;
    }

    setIsConfirming(true);

    try {
      const isSharedRide = selectedMode === "confort-partage";
      
      const { data: tripData, error } = await supabase.from("trips").insert({
        user_id: user.id,
        trip_type: selectedMode,
        origin,
        destination: destination.name,
        fare: calculatePrice(),
        status: "pending",
        current_status: "searching",
        is_shared_ride: isSharedRide,
        started_at: new Date().toISOString(),
      }).select().single();

      if (error) throw error;

      // Pour les courses partagées, ajouter l'utilisateur comme passager
      if (isSharedRide && tripData) {
        const { error: passengerError } = await supabase.from("shared_ride_passengers").insert({
          trip_id: tripData.id,
          user_id: user.id,
          fare_amount: calculatePrice(),
          pickup_location: origin,
          dropoff_location: destination.name,
        });
        
        if (passengerError) {
          console.error("Error adding passenger:", passengerError);
        }
      }

      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        // Navigate to active trip page instead of home
        navigate("/trip");
        toast.success("Course confirmée!", {
          description: `Un chauffeur vers ${destination.name} arrive bientôt.`,
        });
      }, 2000);
    } catch (error) {
      console.error("Error creating trip:", error);
      toast.error("Erreur lors de la réservation");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <MobileLayout>
      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6">
            <div className="w-20 h-20 rounded-full bg-lokebo-success/20 flex items-center justify-center mb-4 animate-pulse">
              <CheckCircle2 className="w-10 h-10 text-lokebo-success" />
            </div>
            <DialogTitle className="text-xl mb-2">Course confirmée!</DialogTitle>
            <p className="text-muted-foreground text-center">
              Un chauffeur arrive dans ~{estimatedTime} minutes
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content - Uber-like layout */}
      <div className="flex flex-col h-full">
        {/* Top Section - Destination selector */}
        <div className="px-4 pt-4 pb-3">
          {/* Destination Card - tappable */}
          <button
            onClick={() => setShowDestinationDrawer(true)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border-2 border-border hover:border-primary/50 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
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
              <div className="mt-4 p-4 rounded-2xl bg-muted/50 border border-border">
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                  <Clock className="w-4 h-4" />
                  <span>Arrivée estimée: {currentMode.eta}</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 py-1">
                    <div className="w-2 h-2 rounded-full bg-lokebo-success" />
                    <div className="w-0.5 h-8 bg-border" />
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Départ</p>
                      <p className="font-medium text-sm">{origin}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Destination</p>
                      <p className="font-medium text-sm">{destination.name}</p>
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
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <MapPin className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Où allez-vous ?</h2>
            <p className="text-muted-foreground">
              Entrez votre destination pour voir les options de transport disponibles.
            </p>
          </div>
        )}

        {/* Bottom CTA */}
        {destination && selectedMode && (
          <div className="p-4 bg-background border-t border-border">
            <Button
              className="w-full h-14 text-lg font-bold rounded-2xl"
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
                  <Radio className="w-5 h-5 mr-2" />
                  Commander - {calculatePrice().toLocaleString()} FCFA
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Paiement via Wallet ou espèces
            </p>
          </div>
        )}
      </div>

      {/* Destination Drawer */}
      <Drawer open={showDestinationDrawer} onOpenChange={setShowDestinationDrawer}>
        <DrawerContent className="h-[85vh]">
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

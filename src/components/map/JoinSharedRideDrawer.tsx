import { useState, useEffect } from "react";
import { Vehicle } from "@/hooks/useVehicles";
import { Button } from "@/components/ui/button";
import { Users, MapPin, Navigation, Calculator, Clock, Check, Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface JoinSharedRideDrawerProps {
  vehicle: Vehicle | null;
  userLocation: { lat: number; lng: number } | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (vehicle: Vehicle, fare: number) => void;
}

// Calcule la distance entre deux points en km (formule Haversine)
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Coordonnées approximatives des destinations connues à Douala
const destinationCoords: Record<string, { lat: number; lng: number }> = {
  "Akwa": { lat: 4.0435, lng: 9.6986 },
  "Bonanjo": { lat: 4.0293, lng: 9.6893 },
  "Kotto": { lat: 4.0088, lng: 9.7478 },
  "Deido": { lat: 4.0561, lng: 9.7021 },
  "Bepanda": { lat: 4.0355, lng: 9.7342 },
  "Bonapriso": { lat: 4.0189, lng: 9.6918 },
  "Ndokotti": { lat: 4.0489, lng: 9.7498 },
  "Makepe": { lat: 4.0621, lng: 9.7389 },
  "Logbessou": { lat: 4.0156, lng: 9.7612 },
  "Yassa": { lat: 4.0012, lng: 9.7823 },
};

export const JoinSharedRideDrawer = ({
  vehicle,
  userLocation,
  open,
  onClose,
  onConfirm,
}: JoinSharedRideDrawerProps) => {
  const [isJoining, setIsJoining] = useState(false);
  const [calculatedFare, setCalculatedFare] = useState(0);
  const [remainingKm, setRemainingKm] = useState(0);

  useEffect(() => {
    if (vehicle && userLocation && vehicle.destination) {
      // Trouver les coordonnées de la destination
      const destKey = Object.keys(destinationCoords).find(
        key => vehicle.destination?.toLowerCase().includes(key.toLowerCase())
      );
      
      if (destKey) {
        const destCoords = destinationCoords[destKey];
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          destCoords.lat,
          destCoords.lng
        );
        
        // Distance restante arrondie
        const km = Math.max(0.5, Math.round(distance * 10) / 10);
        setRemainingKm(km);
        
        // Calcul du tarif basé sur km restant
        const farePerKm = vehicle.shared_ride_fare_per_km || 200;
        const fare = Math.round(km * farePerKm);
        setCalculatedFare(fare);
      } else {
        // Estimation par défaut si destination non reconnue
        setRemainingKm(3);
        setCalculatedFare(600);
      }
    }
  }, [vehicle, userLocation]);

  const handleJoin = async () => {
    if (!vehicle) return;
    setIsJoining(true);
    
    // Simulation d'un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onConfirm(vehicle, calculatedFare);
    setIsJoining(false);
  };

  if (!vehicle) return null;

  const availableSeats = (vehicle.capacity || 4) - (vehicle.current_passengers || 0);
  const currentPassengers = vehicle.current_passengers || 0;
  const farePerKm = vehicle.shared_ride_fare_per_km || 200;

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="flex items-center gap-2 text-lg">
            <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-500" />
            </div>
            Rejoindre la course partagée
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-4">
          {/* Vehicle Info */}
          <div className="p-4 rounded-2xl bg-muted/50 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-lg">{vehicle.plate_number}</p>
                <p className="text-sm text-muted-foreground">
                  {currentPassengers}/{vehicle.capacity || 4} passagers
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Places dispo</p>
                <p className="text-2xl font-bold text-violet-500">{availableSeats}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Destination:</span>
              <span className="font-semibold">{vehicle.destination}</span>
            </div>
          </div>

          {/* Fare Calculation */}
          <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-violet-500" />
              <span className="font-semibold">Calcul de votre tarif</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Distance restante</span>
                <span className="font-medium">{remainingKm} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tarif par km</span>
                <span className="font-medium">{farePerKm} FCFA</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between text-base">
                <span className="font-semibold">Votre tarif</span>
                <span className="font-bold text-violet-500">{calculatedFare.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/30">
            <p className="text-sm font-medium text-green-600 mb-2">
              ✨ Avantages pour tous
            </p>
            <p className="text-xs text-muted-foreground">
              En rejoignant cette course, les autres passagers bénéficieront 
              d'une réduction sur leur tarif initial. Plus on est nombreux, 
              moins ça coûte!
            </p>
          </div>

          {/* ETA */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Arrivée estimée</p>
              <p className="text-xs text-muted-foreground">
                Le véhicule vous récupère dans ~{Math.round(remainingKm * 2)} min
              </p>
            </div>
          </div>

          {/* Action Button */}
          <Button
            className="w-full h-14 text-lg font-bold rounded-2xl bg-violet-500 hover:bg-violet-600"
            onClick={handleJoin}
            disabled={isJoining || availableSeats < 1}
          >
            {isJoining ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Réservation en cours...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Confirmer - {calculatedFare.toLocaleString()} FCFA
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Le paiement sera prélevé de votre wallet à la fin de la course
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

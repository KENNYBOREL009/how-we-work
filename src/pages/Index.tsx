import { useState, useEffect } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { HomeMap } from "@/components/map";
import { JoinSharedRideDrawer } from "@/components/map/JoinSharedRideDrawer";
import SeatReservationDrawer from "@/components/booking/SeatReservationDrawer";
import { NewUserDetector } from "@/components/onboarding";
import { MapPin, Bus, Users, Calendar, Search, Armchair } from "lucide-react";
import { useBusMode } from "@/hooks/useBusMode";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Vehicle } from "@/hooks/useVehicles";
import { toast } from "sonner";

const Index = () => {
  const { isBusModeEnabled, toggleBusMode } = useBusMode();
  const navigate = useNavigate();
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedSharedVehicle, setSelectedSharedVehicle] = useState<Vehicle | null>(null);
  const [showJoinDrawer, setShowJoinDrawer] = useState(false);
  const [showSeatReservation, setShowSeatReservation] = useState(false);
  const [selectedTaxiForSeat, setSelectedTaxiForSeat] = useState<Vehicle | null>(null);

  // Écouter les événements de sélection de taxi depuis la carte
  useEffect(() => {
    const handleSelectTaxi = (e: CustomEvent) => {
      try {
        const detail = JSON.parse(e.detail);
        if (detail.canJoin) {
          // C'est une course partagée - on gère différemment
          // Le véhicule sera passé via onVehicleClick
        }
      } catch {
        // Format ancien, ignorer
      }
    };

    window.addEventListener('selectTaxi', handleSelectTaxi as EventListener);
    return () => window.removeEventListener('selectTaxi', handleSelectTaxi as EventListener);
  }, []);

  const handleVehicleClick = (vehicle: Vehicle) => {
    // Vérifier si c'est une course partagée qu'on peut rejoindre
    const isSharedRide = vehicle.ride_mode === 'confort-partage';
    const availableSeats = (vehicle.capacity || 4) - (vehicle.current_passengers || 0);
    const canJoin = isSharedRide && availableSeats > 0 && vehicle.destination;

    if (canJoin) {
      // Ouvrir le drawer pour rejoindre la course partagée
      setSelectedSharedVehicle(vehicle);
      setShowJoinDrawer(true);
    } else if (vehicle.vehicle_type === 'taxi' && availableSeats > 0) {
      // Taxi collectif - ouvrir la réservation de siège
      setSelectedTaxiForSeat(vehicle);
      setShowSeatReservation(true);
    } else {
      // Comportement normal pour autres cas
      toast.info(`🚕 ${vehicle.plate_number}`, {
        description: vehicle.destination 
          ? `Direction: ${vehicle.destination}` 
          : 'Destination libre - Cliquez pour réserver',
        action: {
          label: 'Réserver',
          onClick: () => navigate('/book', { state: { selectedVehicle: vehicle } }),
        },
      });
    }
  };

  const handleSeatReservation = (reservation: {
    vehicleId: string;
    seatPreference: 'front' | 'back-window' | 'back-middle' | null;
    totalPrice: number;
  }) => {
    toast.success('🎉 Place réservée !', {
      description: `Le chauffeur arrive dans 3-5 min. Total: ${reservation.totalPrice} FCFA`,
    });
    // Rediriger vers la page de suivi
    navigate('/trip', { 
      state: { 
        seatReservation: reservation,
        vehicle: selectedTaxiForSeat,
      } 
    });
  };

  const handleJoinConfirm = (vehicle: Vehicle, fare: number) => {
    setShowJoinDrawer(false);
    toast.success(`🎉 Course rejointe!`, {
      description: `Vous payerez ${fare.toLocaleString()} FCFA pour ${vehicle.destination}`,
    });
    // Ici on pourrait créer un trip dans la base de données
    navigate('/book', { 
      state: { 
        selectedVehicle: vehicle, 
        joinedSharedRide: true,
        calculatedFare: fare 
      } 
    });
  };

  return (
    <MobileLayout showThemeToggle={false}>
      {/* New User Guide Detector */}
      <NewUserDetector userType="client" />
      
      {/* Header */}
      <header className="safe-top px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <Logo variant="full" size="md" />
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle className="w-9 h-9" />
            {/* Bus Mode Toggle */}
            <Button
              size="icon"
              variant="outline"
              className={cn(
                "rounded-full w-9 h-9 transition-all duration-300",
                isBusModeEnabled && "bg-lokebo-dark text-primary border-lokebo-dark shadow-lg"
              )}
              onClick={toggleBusMode}
              title={isBusModeEnabled ? "Désactiver Mode Bus" : "Activer Mode Bus"}
            >
              <Bus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          Douala, Cameroun
        </p>
      </header>

      {/* Interactive Map with Taxis */}
      <div className="relative flex-1 mx-4 mb-4 min-h-[340px]">
        <HomeMap 
          className="w-full min-h-[340px] border border-border card-shadow" 
          onVehicleClick={handleVehicleClick}
          onLocationFound={setUserLocation}
        />

        {/* Floating Legend */}
        <div className="absolute bottom-4 left-4 right-4 glass rounded-xl p-2.5 border border-border/50 z-10">
          <div className="flex items-center justify-around text-[10px] font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="text-foreground">Taxi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--lokebo-success))]" />
              <span className="text-foreground">Vide</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--lokebo-warning))]" />
              <span className="text-foreground">Partiel</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
              <span className="text-foreground">Plein</span>
            </div>
          </div>
        </div>
      </div>

      {/* Join Shared Ride Drawer */}
      <JoinSharedRideDrawer
        vehicle={selectedSharedVehicle}
        userLocation={userLocation}
        open={showJoinDrawer}
        onClose={() => setShowJoinDrawer(false)}
        onConfirm={handleJoinConfirm}
      />

      {/* Seat Reservation Drawer */}
      <SeatReservationDrawer
        open={showSeatReservation}
        onOpenChange={setShowSeatReservation}
        vehicle={selectedTaxiForSeat}
        onConfirm={handleSeatReservation}
      />

      {/* Quick Actions */}
      <div className="px-4 pb-4 space-y-3">
        {/* Main CTA - Redesigned */}
        <Button 
          className="w-full h-14 text-base font-semibold rounded-xl elevated hover-scale gap-3"
          size="lg"
          onClick={() => navigate("/book")}
        >
          <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Search className="w-4 h-4" />
          </div>
          <span>Où allons-nous ?</span>
        </Button>
        
        {/* Secondary Actions Grid */}
        <div className="grid grid-cols-3 gap-2">
          <Button 
            variant="outline" 
            className="h-14 rounded-xl flex flex-col items-center justify-center gap-1 hover-scale border border-border bg-card relative overflow-hidden group"
            onClick={() => {
              const mockTaxi: Vehicle = {
                id: 'taxi-demo',
                vehicle_type: 'taxi',
                plate_number: 'LT 1234 A',
                capacity: 4,
                destination: 'Bonanjo',
                status: 'available',
                current_passengers: 1,
                ride_mode: 'standard',
                latitude: 4.0511,
                longitude: 9.7043,
              };
              setSelectedTaxiForSeat(mockTaxi);
              setShowSeatReservation(true);
            }}
          >
            <span className="absolute top-0 right-0 px-1.5 py-0.5 bg-primary text-primary-foreground text-[8px] font-bold rounded-bl-lg">
              E-HAILING
            </span>
            <Armchair className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">Réserver Siège</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-14 rounded-xl flex flex-col items-center justify-center gap-1 hover-scale border border-border bg-card relative overflow-hidden group"
            onClick={() => navigate("/book", { state: { preselectedMode: "confort-partage" } })}
          >
            <span className="absolute top-0 right-0 px-1.5 py-0.5 bg-secondary text-secondary-foreground text-[8px] font-bold rounded-bl-lg">
              ÉCONOMIQUE
            </span>
            <Users className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">Partagé</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-14 rounded-xl flex flex-col items-center justify-center gap-1 hover-scale border border-border bg-card group"
            onClick={() => navigate("/schedule")}
          >
            <Calendar className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">Programmer</span>
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Index;

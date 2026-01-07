import { useState, useEffect } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/Logo";
import { HomeMap } from "@/components/map";
import { JoinSharedRideDrawer } from "@/components/map/JoinSharedRideDrawer";
import { MapPin, Navigation, Bus, Users, Crown, Calendar, Search } from "lucide-react";
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
      // Ouvrir le drawer pour rejoindre la course
      setSelectedSharedVehicle(vehicle);
      setShowJoinDrawer(true);
    } else {
      // Comportement normal
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
    <MobileLayout>
      {/* Header */}
      <header className="safe-top px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <Logo variant="full" size="md" />
          <div className="flex items-center gap-2">
            {/* Bus Mode Toggle */}
            <Button
              size="icon"
              variant="outline"
              className={cn(
                "rounded-full w-10 h-10 transition-all duration-300",
                isBusModeEnabled && "bg-lokebo-dark text-primary border-lokebo-dark shadow-lg"
              )}
              onClick={toggleBusMode}
              title={isBusModeEnabled ? "Désactiver Mode Bus" : "Activer Mode Bus"}
            >
              <Bus className="w-5 h-5" />
            </Button>
            <Button size="icon" variant="ghost" className="rounded-full w-10 h-10">
              <Navigation className="w-5 h-5" />
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
        <div className="absolute bottom-4 left-4 right-4 glass rounded-xl p-3 border border-border/50 z-10">
          <div className="flex items-center justify-around text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-lokebo-success animate-pulse" />
              <span className="text-foreground">Libre</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-violet-500" />
              <span className="text-foreground">Partagé</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-foreground">Privé</span>
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

      {/* Quick Actions */}
      <div className="px-4 pb-4 space-y-3">
        {/* Main CTA */}
        <Button 
          className="w-full h-16 text-lg font-bold rounded-2xl elevated hover-scale"
          size="lg"
          onClick={() => navigate("/book")}
        >
          <Search className="w-6 h-6 mr-3" />
          Où allons-nous ?
        </Button>
        
        {/* Secondary Actions Grid */}
        <div className="grid grid-cols-3 gap-2">
          <Button 
            variant="outline" 
            className="h-16 rounded-xl flex flex-col items-center justify-center gap-1 hover-scale border-2"
            onClick={() => navigate("/book", { state: { preselectedMode: "reservation" } })}
          >
            <Users className="w-5 h-5 text-primary" />
            <span className="text-xs font-semibold">Réserver</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-16 rounded-xl flex flex-col items-center justify-center gap-1 hover-scale border-2"
            onClick={() => navigate("/book", { state: { preselectedMode: "confort-partage" } })}
          >
            <Crown className="w-5 h-5 text-primary" />
            <span className="text-xs font-semibold">Confort</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-16 rounded-xl flex flex-col items-center justify-center gap-1 hover-scale border-2 border-amber-500/50 bg-amber-500/5"
            onClick={() => navigate("/schedule")}
          >
            <Calendar className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-semibold text-amber-600">Programmer</span>
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Index;

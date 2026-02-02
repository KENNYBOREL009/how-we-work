import { useState, useEffect } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { HomeMap } from "@/components/map";
import { JoinSharedRideDrawer } from "@/components/map/JoinSharedRideDrawer";
import SeatReservationDrawer from "@/components/booking/SeatReservationDrawer";
import { NewUserDetector } from "@/components/onboarding";
import { MapPin, Bus, Users, Calendar, Search, Armchair, Sparkles } from "lucide-react";
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
        }
      } catch {
        // Format ancien, ignorer
      }
    };

    window.addEventListener('selectTaxi', handleSelectTaxi as EventListener);
    return () => window.removeEventListener('selectTaxi', handleSelectTaxi as EventListener);
  }, []);

  const handleVehicleClick = (vehicle: Vehicle) => {
    const isSharedRide = vehicle.ride_mode === 'confort-partage';
    const availableSeats = (vehicle.capacity || 4) - (vehicle.current_passengers || 0);
    const canJoin = isSharedRide && availableSeats > 0 && vehicle.destination;

    if (canJoin) {
      setSelectedSharedVehicle(vehicle);
      setShowJoinDrawer(true);
    } else if (vehicle.vehicle_type === 'taxi' && availableSeats > 0) {
      setSelectedTaxiForSeat(vehicle);
      setShowSeatReservation(true);
    } else {
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
      
      {/* Premium Header with Glass Effect */}
      <header className="safe-top px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 animate-fade-in">
            <Logo variant="full" size="md" />
          </div>
          
          {/* Premium Control Pills */}
          <div className="flex items-center gap-2">
            <ThemeToggle className="w-10 h-10 rounded-xl glass border border-border/50 shadow-sm hover:shadow-md transition-shadow" />
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "w-10 h-10 rounded-xl glass border border-border/50 shadow-sm transition-all duration-300 hover:shadow-md",
                isBusModeEnabled && "bg-primary/20 border-primary shadow-[0_0_16px_hsl(var(--primary)/0.4)]"
              )}
              onClick={toggleBusMode}
              title={isBusModeEnabled ? "Désactiver Mode Bus" : "Activer Mode Bus"}
            >
              <Bus className={cn("w-5 h-5 transition-colors", isBusModeEnabled ? "text-primary" : "text-muted-foreground")} />
            </Button>
          </div>
        </div>
        
        {/* Animated Location Badge */}
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-border/30 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--lokebo-success))] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--lokebo-success))]"></span>
          </span>
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span className="text-sm font-medium">Douala, Cameroun</span>
        </div>
      </header>

      {/* Premium Map Container */}
      <div className="relative flex-1 mx-4 mb-4 min-h-[300px]">
        {/* Subtle glow effect */}
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-b from-primary/30 to-transparent blur-lg opacity-40 pointer-events-none" />
        
        <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-[0_8px_40px_-12px_hsl(var(--lokebo-dark)/0.2)]">
          <HomeMap 
            className="w-full min-h-[300px]" 
            onVehicleClick={handleVehicleClick}
            onLocationFound={setUserLocation}
          />
          
          {/* Premium Floating Legend */}
          <div className="absolute bottom-3 left-3 right-3 z-10 animate-slide-up">
            <div className="glass rounded-xl p-2.5 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between gap-3">
                {/* Vehicle Types */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#FFD42F]/10 border border-[#FFD42F]/30">
                    <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: '#FFD42F' }} />
                    <span className="text-[10px] font-semibold text-foreground">Taxi</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-500/10 border border-violet-500/30">
                    <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: '#8b5cf6' }} />
                    <span className="text-[10px] font-semibold text-foreground">Confort</span>
                  </div>
                </div>
                
                {/* Separator */}
                <div className="h-5 w-px bg-border/50" />
                
                {/* Status Indicators */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[hsl(var(--lokebo-success))]" />
                    <span className="text-[9px] text-muted-foreground">Dispo</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[hsl(var(--lokebo-warning))]" />
                    <span className="text-[9px] text-muted-foreground">Partiel</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-destructive" />
                    <span className="text-[9px] text-muted-foreground">Plein</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawers */}
      <JoinSharedRideDrawer
        vehicle={selectedSharedVehicle}
        userLocation={userLocation}
        open={showJoinDrawer}
        onClose={() => setShowJoinDrawer(false)}
        onConfirm={handleJoinConfirm}
      />
      <SeatReservationDrawer
        open={showSeatReservation}
        onOpenChange={setShowSeatReservation}
        vehicle={selectedTaxiForSeat}
        onConfirm={handleSeatReservation}
      />

      {/* Premium Quick Actions */}
      <div className="px-4 pb-4 space-y-3 animate-slide-up">
        {/* Main CTA - Premium Search Bar */}
        <Button 
          className="relative w-full h-14 text-base font-semibold rounded-2xl gap-3 overflow-hidden group shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.5)] hover:shadow-[0_8px_30px_-4px_hsl(var(--primary)/0.6)] transition-all duration-300"
          size="lg"
          onClick={() => navigate("/book")}
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-[hsl(48_100%_55%)] to-primary bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite]" />
          
          {/* Content */}
          <div className="relative flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-foreground/20 flex items-center justify-center backdrop-blur-sm">
              <Search className="w-4.5 h-4.5" />
            </div>
            <span className="text-primary-foreground">Où allons-nous ?</span>
          </div>
          
          {/* Sparkle icon */}
          <Sparkles className="relative w-4 h-4 text-primary-foreground/70 ml-auto" />
        </Button>
        
        {/* Secondary Actions - Premium Cards */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* E-Hailing Card */}
          <button 
            className="group relative h-20 rounded-2xl flex flex-col items-center justify-center gap-1.5 bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
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
            {/* Badge */}
            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-gradient-to-r from-primary to-[hsl(48_100%_55%)] text-primary-foreground text-[7px] font-bold rounded-md shadow-sm">
              E-HAILING
            </span>
            
            {/* Icon with background */}
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Armchair className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Réserver Siège</span>
          </button>
          
          {/* Comfort Shared Card */}
          <button 
            className="group relative h-20 rounded-2xl flex flex-col items-center justify-center gap-1.5 bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-violet-500/30 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
            onClick={() => navigate("/book", { state: { preselectedMode: "confort-partage" } })}
          >
            {/* Badge */}
            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-[7px] font-bold rounded-md shadow-sm">
              ÉCONOMIQUE
            </span>
            
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
              <Users className="w-5 h-5 text-violet-500" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Partagé</span>
          </button>
          
          {/* Schedule Card */}
          <button 
            className="group relative h-20 rounded-2xl flex flex-col items-center justify-center gap-1.5 bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-blue-500/30 hover:-translate-y-0.5 transition-all duration-200"
            onClick={() => navigate("/schedule")}
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Programmer</span>
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Index;
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/Logo";
import MapboxMap from "@/components/map/MapboxMap";
import { MapPin, Navigation, Car, Bus, Zap, Users, Crown } from "lucide-react";
import { useBusMode } from "@/hooks/useBusMode";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { isBusModeEnabled, toggleBusMode } = useBusMode();
  const navigate = useNavigate();

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

      {/* Interactive Map */}
      <div className="relative flex-1 mx-4 mb-4">
        <MapboxMap className="w-full h-full border border-border card-shadow" />

        {/* Floating Legend */}
        <div className="absolute bottom-4 left-4 right-4 glass rounded-xl p-3 border border-border/50 z-10">
          <div className="flex items-center justify-around text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-lokebo-success animate-pulse" />
              <span className="text-foreground">Libre</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-lokebo-warning" />
              <span className="text-foreground">Complet</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-foreground">Privé</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-4 space-y-3">
        {/* Main CTA */}
        <Button 
          className="w-full h-16 text-lg font-bold rounded-2xl elevated pulse-ring hover-scale"
          size="lg"
          onClick={() => navigate("/signal")}
        >
          <Zap className="w-6 h-6 mr-3" />
          Lancer un Signal
        </Button>
        
        {/* Secondary Actions Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="h-14 rounded-xl flex flex-col items-center justify-center gap-1 hover-scale border-2"
          >
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold">Réserver Place</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-14 rounded-xl flex flex-col items-center justify-center gap-1 hover-scale border-2"
          >
            <Crown className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold">Mode Confort</span>
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Index;

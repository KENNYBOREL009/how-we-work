import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  MapPin, 
  ChevronLeft,
  Zap,
  Users,
  Clock,
  CheckCircle2,
  Loader2,
  Navigation,
  Minus,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface NearbyDriver {
  id: string;
  plate_number: string;
  destination: string | null;
  distance: number;
  eta: number;
}

const Signal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [peopleCount, setPeopleCount] = useState(1);
  const [isSignaling, setIsSignaling] = useState(false);
  const [signalSent, setSignalSent] = useState(false);
  const [zoneSignals, setZoneSignals] = useState(0);
  const [nearbyDrivers, setNearbyDrivers] = useState<NearbyDriver[]>([]);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Obtenir la position
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCurrentPosition({ lat: 4.0511, lng: 9.7043 }) // Douala par défaut
      );
    }
  }, []);

  // Charger les signaux actifs dans la zone
  useEffect(() => {
    const fetchZoneSignals = async () => {
      if (!currentPosition) return;
      
      const { data } = await supabase
        .from('client_signals')
        .select('people_count')
        .gte('expires_at', new Date().toISOString());
      
      if (data) {
        const total = data.reduce((sum, s) => sum + (s.people_count || 1), 0);
        setZoneSignals(total);
      }
    };

    fetchZoneSignals();
    
    // Écouter les nouveaux signaux en temps réel
    const channel = supabase
      .channel('signals-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'client_signals'
      }, () => {
        fetchZoneSignals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPosition]);

  const handleSignal = async () => {
    if (!currentPosition) {
      toast.error("Position non disponible");
      return;
    }

    setIsSignaling(true);

    try {
      // Enregistrer le signal en base
      const { error } = await supabase.from('client_signals').insert({
        user_id: user?.id || null,
        latitude: currentPosition.lat,
        longitude: currentPosition.lng,
        people_count: peopleCount,
      });

      if (error) throw error;

      // Simuler les chauffeurs alertés (en prod: query real nearby drivers)
      const mockDrivers: NearbyDriver[] = [
        { id: '1', plate_number: 'LT 1234 A', destination: 'Akwa', distance: 0.3, eta: 2 },
        { id: '2', plate_number: 'LT 5678 B', destination: 'Bonanjo', distance: 0.5, eta: 3 },
        { id: '3', plate_number: 'LT 9012 C', destination: null, distance: 0.8, eta: 5 },
      ];

      setNearbyDrivers(mockDrivers);
      setSignalSent(true);
      setZoneSignals(prev => prev + peopleCount);

      toast.success("Signal envoyé !", {
        description: `${peopleCount} personne${peopleCount > 1 ? 's' : ''} • ${mockDrivers.length} chauffeurs alertés`,
      });
    } catch (error) {
      console.error("Signal error:", error);
      toast.error("Erreur lors de l'envoi du signal");
    } finally {
      setIsSignaling(false);
    }
  };

  const handleSelectDriver = (driver: NearbyDriver) => {
    toast.success(`Taxi ${driver.plate_number} contacté !`, {
      description: driver.destination 
        ? `Direction ${driver.destination} • Arrivée ~${driver.eta} min`
        : `Taxi libre • Arrivée ~${driver.eta} min`,
    });
    
    // Naviguer vers le suivi de course
    navigate("/trip", { 
      state: {
        origin: "Ma position",
        destination: driver.destination || "À définir",
        fare: 1500,
        tripType: "reservation",
      }
    });
  };

  const resetSignal = () => {
    setSignalSent(false);
    setNearbyDrivers([]);
  };

  return (
    <MobileLayout showNav={false} showThemeToggle={false}>
      <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/30">
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
          <div className="flex-1">
            <h1 className="text-lg font-bold">Signal</h1>
            <p className="text-xs text-muted-foreground">Alertez les taxis de votre présence</p>
          </div>
          {zoneSignals > 0 && (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
              <Users className="w-3 h-3 text-amber-500" />
              <span className="text-xs font-semibold text-amber-600">{zoneSignals}</span>
            </div>
          )}
        </header>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {!signalSent ? (
            <>
              {/* Signal button */}
              <div className="relative mb-8">
                {/* Pulse rings */}
                {isSignaling && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '1.5s' }} />
                    <div className="absolute inset-[-20px] rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                  </>
                )}
                
                <button
                  onClick={handleSignal}
                  disabled={isSignaling}
                  className={cn(
                    "w-40 h-40 rounded-full flex flex-col items-center justify-center transition-all duration-300",
                    "bg-gradient-to-br from-primary to-primary/80",
                    "shadow-[0_0_60px_rgba(255,212,47,0.4)]",
                    "hover:shadow-[0_0_80px_rgba(255,212,47,0.6)] hover:scale-105",
                    "active:scale-95",
                    isSignaling && "animate-pulse"
                  )}
                >
                  {isSignaling ? (
                    <Loader2 className="w-12 h-12 text-primary-foreground animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-12 h-12 text-primary-foreground mb-1" />
                      <span className="text-primary-foreground font-bold text-lg">SIGNAL</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sélecteur nombre de personnes */}
              <div className="flex items-center gap-4 mb-6 p-3 rounded-2xl bg-card border border-border">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium flex-1">Nous sommes</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                    disabled={peopleCount <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-lg">{peopleCount}</span>
                  <button
                    onClick={() => setPeopleCount(Math.min(10, peopleCount + 1))}
                    className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-primary-foreground" />
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="text-center max-w-xs">
                <h2 className="text-xl font-bold mb-2">Signalez votre présence</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {peopleCount > 1 
                    ? `Signal pour ${peopleCount} personnes • Attire plus de taxis`
                    : "Un signal sera envoyé aux taxis à proximité"
                  }
                </p>
                
                {/* Position indicator */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    {currentPosition 
                      ? `${currentPosition.lat.toFixed(4)}, ${currentPosition.lng.toFixed(4)}`
                      : "Localisation..."
                    }
                  </span>
                </div>
              </div>

              {/* Info cards */}
              <div className="grid grid-cols-2 gap-3 mt-8 w-full max-w-sm">
                <div className="p-4 rounded-2xl bg-card border border-border text-center">
                  <Navigation className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Rayon d'alerte</p>
                  <p className="font-bold">500m</p>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border text-center">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                  <p className="text-xs text-muted-foreground">Durée signal</p>
                  <p className="font-bold">5 min</p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Signal sent - show nearby drivers */}
              <div className="w-full max-w-sm">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h2 className="text-xl font-bold mb-1">Signal actif !</h2>
                  <p className="text-sm text-muted-foreground">
                    {nearbyDrivers.length} chauffeur(s) alerté(s) à proximité
                  </p>
                </div>

                {/* Drivers list */}
                <div className="space-y-3 mb-6">
                  {nearbyDrivers.map((driver) => (
                    <button
                      key={driver.id}
                      onClick={() => handleSelectDriver(driver)}
                      className="w-full p-4 rounded-2xl bg-card border-2 border-border hover:border-primary/50 transition-all text-left flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                        <span className="text-primary-foreground font-bold text-sm">
                          {driver.plate_number.slice(-3)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{driver.plate_number}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {driver.destination 
                            ? `→ ${driver.destination}`
                            : "🟢 Disponible"
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{driver.distance} km</p>
                        <p className="font-bold text-primary">~{driver.eta} min</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full h-12"
                    onClick={resetSignal}
                  >
                    Renvoyer un signal
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => navigate("/")}
                  >
                    Retour à l'accueil
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom info */}
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground">
            💡 Les chauffeurs à proximité verront votre zone sur leur carte
          </p>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Signal;

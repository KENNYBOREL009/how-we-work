import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MapPin, 
  Navigation, 
  Phone, 
  MessageCircle, 
  Clock, 
  Users, 
  Star,
  Shield,
  X,
  AlertTriangle
} from "lucide-react";
import { Vehicle } from "@/hooks/useVehicles";
import { cn } from "@/lib/utils";

interface Passenger {
  id: string;
  first_name: string;
  avatar_url?: string;
  pickup_location: string;
  dropoff_location: string;
}

interface ActiveTripViewProps {
  vehicle: Vehicle;
  destination: string;
  origin: string;
  fare: number;
  isSharedRide?: boolean;
  isPrivate?: boolean;
  vehicleClassName?: string;
  selectedServices?: string[];
  passengers?: Passenger[];
  onCancel: () => void;
  onEmergency: () => void;
}

export const ActiveTripView = ({
  vehicle,
  destination,
  origin,
  fare,
  isSharedRide = false,
  isPrivate = false,
  vehicleClassName,
  selectedServices = [],
  passengers = [],
  onCancel,
  onEmergency,
}: ActiveTripViewProps) => {
  const [tripStatus, setTripStatus] = useState<'searching' | 'driver_assigned' | 'arriving' | 'in_progress'>('driver_assigned');
  const [eta, setEta] = useState(5);
  const [progress, setProgress] = useState(0);

  // Simulation du trajet
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
      
      setEta(prev => Math.max(0, prev - 0.1));
    }, 1000);

    // Simulation des étapes
    const statusTimeout = setTimeout(() => {
      setTripStatus('arriving');
      setTimeout(() => setTripStatus('in_progress'), 5000);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(statusTimeout);
    };
  }, []);

  const statusMessages = {
    searching: "Recherche d'un chauffeur...",
    driver_assigned: "Chauffeur en route vers vous",
    arriving: "Le chauffeur arrive",
    in_progress: "Course en cours",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header avec statut */}
      <div className={`p-4 ${isPrivate ? 'bg-gradient-to-r from-amber-500 to-orange-600' : 'bg-primary'} text-primary-foreground`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-3 h-3 rounded-full animate-pulse",
              tripStatus === 'in_progress' ? "bg-green-400" : "bg-white"
            )} />
            <span className="font-semibold">{statusMessages[tripStatus]}</span>
            {isPrivate && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">VIP</span>}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary-foreground hover:bg-primary-foreground/20"
            onClick={onCancel}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Progress bar */}
        <div className="h-1.5 bg-primary-foreground/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary-foreground transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Carte placeholder */}
      <div className="flex-1 bg-muted relative min-h-[200px]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Navigation className="w-12 h-12 mx-auto mb-2 animate-pulse" />
            <p className="text-sm">Carte de suivi</p>
          </div>
        </div>
        
        {/* ETA Badge */}
        <div className="absolute top-4 left-4 bg-background rounded-xl px-4 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="font-bold">{Math.ceil(eta)} min</span>
          </div>
        </div>

        {/* Emergency Button */}
        <Button
          variant="destructive"
          size="sm"
          className="absolute top-4 right-4 rounded-xl"
          onClick={onEmergency}
        >
          <AlertTriangle className="w-4 h-4 mr-1" />
          Urgence
        </Button>
      </div>

      {/* Détails du trajet */}
      <div className="p-4 space-y-4 bg-background border-t border-border">
        {/* Private ride badge */}
        {isPrivate && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Star className="w-4 h-4 text-white fill-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-amber-600">Course Privée VIP</p>
              <p className="text-xs text-muted-foreground">
                {vehicleClassName && `${vehicleClassName} • `}
                {selectedServices.length > 0 ? selectedServices.join(', ') : 'Véhicule dédié'}
              </p>
            </div>
          </div>
        )}

        {/* Itinéraire */}
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <div className="w-0.5 h-8 bg-border" />
            <div className={`w-3 h-3 rounded-full ${isPrivate ? 'bg-amber-500' : 'bg-primary'}`} />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Départ</p>
              <p className="font-medium text-sm">{origin}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Destination</p>
              <p className="font-medium text-sm">{destination}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Tarif</p>
            <p className={`font-bold ${isPrivate ? 'text-amber-500' : 'text-primary'}`}>{fare.toLocaleString()} FCFA</p>
          </div>
        </div>

        {/* Info chauffeur */}
        <div className={`flex items-center justify-between p-3 rounded-xl border ${
          isPrivate 
            ? 'bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-amber-500/20' 
            : 'bg-muted/50 border-border'
        }`}>
          <div className="flex items-center gap-3">
            <Avatar className={`w-12 h-12 border-2 ${isPrivate ? 'border-amber-500' : 'border-primary'}`}>
              <AvatarFallback className={`font-bold ${isPrivate ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white' : 'bg-primary text-primary-foreground'}`}>
                {vehicle.plate_number.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{vehicle.plate_number}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span>{isPrivate ? '4.9' : '4.8'}</span>
                <span>•</span>
                <span>{vehicle.operator || 'Taxi'}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-full">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full">
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Co-passagers (si course partagée) */}
        {isSharedRide && passengers.length > 0 && (
          <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-violet-500" />
              <span className="font-semibold text-sm">Co-passagers ({passengers.length})</span>
              <Shield className="w-4 h-4 text-green-500 ml-auto" />
            </div>
            <div className="space-y-2">
              {passengers.map((passenger) => (
                <div key={passenger.id} className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={passenger.avatar_url} />
                    <AvatarFallback className="bg-violet-500/20 text-violet-500 text-xs">
                      {passenger.first_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{passenger.first_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      → {passenger.dropoff_location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Identités vérifiées pour votre sécurité
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

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
  AlertTriangle,
  Car,
  CheckCircle2,
  Flag
} from "lucide-react";
import { Vehicle } from "@/hooks/useVehicles";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Passenger {
  id: string;
  first_name: string;
  avatar_url?: string;
  pickup_location: string;
  dropoff_location: string;
}

export type TripStatus = 'driver_assigned' | 'driver_arriving' | 'driver_arrived' | 'picked_up' | 'in_progress' | 'arriving_destination' | 'arrived';

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
  onTripComplete?: () => void;
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
  onTripComplete,
}: ActiveTripViewProps) => {
  const [tripStatus, setTripStatus] = useState<TripStatus>('driver_assigned');
  const [eta, setEta] = useState(3);
  const [tripEta, setTripEta] = useState(8);
  const [progress, setProgress] = useState(0);

  // Simulation réaliste du trajet complet
  useEffect(() => {
    const stages: { status: TripStatus; delay: number; message?: string }[] = [
      { status: 'driver_assigned', delay: 0 },
      { status: 'driver_arriving', delay: 2000, message: "🚗 Le chauffeur est en route" },
      { status: 'driver_arrived', delay: 4000, message: "📍 Le chauffeur est arrivé !" },
      { status: 'picked_up', delay: 6000, message: "✅ Vous êtes à bord" },
      { status: 'in_progress', delay: 7000 },
      { status: 'arriving_destination', delay: 11000, message: "🏁 Arrivée imminente" },
      { status: 'arrived', delay: 13000, message: "🎉 Vous êtes arrivé !" },
    ];

    const timeouts: NodeJS.Timeout[] = [];

    stages.forEach(({ status, delay, message }) => {
      const timeout = setTimeout(() => {
        setTripStatus(status);
        if (message) {
          toast.info(message);
        }
        if (status === 'arrived' && onTripComplete) {
          setTimeout(onTripComplete, 500);
        }
      }, delay);
      timeouts.push(timeout);
    });

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 1.5;
      });
    }, 130);

    // ETA countdown
    const etaInterval = setInterval(() => {
      setEta(prev => Math.max(0, prev - 0.05));
      setTripEta(prev => Math.max(0, prev - 0.05));
    }, 100);

    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(progressInterval);
      clearInterval(etaInterval);
    };
  }, [onTripComplete]);

  const statusConfig: Record<TripStatus, { message: string; icon: React.ReactNode; color: string }> = {
    driver_assigned: { 
      message: "Chauffeur assigné", 
      icon: <Car className="w-4 h-4" />,
      color: "bg-blue-500"
    },
    driver_arriving: { 
      message: "Chauffeur en route vers vous", 
      icon: <Navigation className="w-4 h-4 animate-pulse" />,
      color: "bg-blue-500"
    },
    driver_arrived: { 
      message: "Le chauffeur est arrivé", 
      icon: <MapPin className="w-4 h-4" />,
      color: "bg-green-500"
    },
    picked_up: { 
      message: "Vous êtes à bord", 
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: "bg-green-500"
    },
    in_progress: { 
      message: "Course en cours", 
      icon: <Navigation className="w-4 h-4" />,
      color: "bg-green-500"
    },
    arriving_destination: { 
      message: "Arrivée imminente", 
      icon: <Flag className="w-4 h-4 animate-bounce" />,
      color: "bg-amber-500"
    },
    arrived: { 
      message: "Vous êtes arrivé !", 
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: "bg-green-500"
    },
  };

  const currentStatus = statusConfig[tripStatus];
  const isBeforePickup = ['driver_assigned', 'driver_arriving', 'driver_arrived'].includes(tripStatus);
  const displayEta = isBeforePickup ? eta : tripEta;

  return (
    <div className="flex flex-col h-full">
      {/* Header avec statut */}
      <div className={`p-4 ${isPrivate ? 'bg-gradient-to-r from-amber-500 to-orange-600' : 'bg-primary'} text-primary-foreground`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-3 h-3 rounded-full",
              currentStatus.color,
              tripStatus !== 'arrived' && "animate-pulse"
            )} />
            <span className="font-semibold flex items-center gap-2">
              {currentStatus.icon}
              {currentStatus.message}
            </span>
            {isPrivate && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">VIP</span>}
          </div>
          {tripStatus !== 'arrived' && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={onCancel}
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="h-1.5 bg-primary-foreground/30 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-300",
              tripStatus === 'arrived' ? "bg-green-400" : "bg-primary-foreground"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Status steps indicator */}
        <div className="flex justify-between mt-3 text-xs">
          <div className={cn("flex flex-col items-center gap-1", isBeforePickup ? "text-primary-foreground" : "text-primary-foreground/50")}>
            <Car className="w-4 h-4" />
            <span>Pickup</span>
          </div>
          <div className={cn("flex flex-col items-center gap-1", ['picked_up', 'in_progress'].includes(tripStatus) ? "text-primary-foreground" : "text-primary-foreground/50")}>
            <Navigation className="w-4 h-4" />
            <span>En route</span>
          </div>
          <div className={cn("flex flex-col items-center gap-1", ['arriving_destination', 'arrived'].includes(tripStatus) ? "text-primary-foreground" : "text-primary-foreground/50")}>
            <Flag className="w-4 h-4" />
            <span>Arrivée</span>
          </div>
        </div>
      </div>

      {/* Carte placeholder avec animation */}
      <div className="flex-1 bg-muted relative min-h-[200px] overflow-hidden">
        {/* Animated background for driving effect */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center",
          tripStatus === 'in_progress' && "animate-pulse"
        )}>
          <div className="text-center text-muted-foreground">
            <Navigation className={cn(
              "w-12 h-12 mx-auto mb-2 transition-transform duration-500",
              tripStatus === 'in_progress' && "text-primary animate-bounce"
            )} />
            <p className="text-sm font-medium">
              {isBeforePickup ? "Chauffeur en approche..." : "En direction de votre destination"}
            </p>
          </div>
        </div>
        
        {/* ETA Badge */}
        <div className={cn(
          "absolute top-4 left-4 rounded-xl px-4 py-2 shadow-lg transition-all",
          tripStatus === 'arrived' 
            ? "bg-green-500 text-white" 
            : "bg-background"
        )}>
          <div className="flex items-center gap-2">
            {tripStatus === 'arrived' ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-bold">Arrivé !</span>
              </>
            ) : (
              <>
                <Clock className={cn("w-4 h-4", isPrivate ? "text-amber-500" : "text-primary")} />
                <span className="font-bold">{Math.ceil(displayEta)} min</span>
                <span className="text-xs text-muted-foreground">
                  {isBeforePickup ? "avant pickup" : "restantes"}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Emergency Button - hide when arrived */}
        {tripStatus !== 'arrived' && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-4 right-4 rounded-xl"
            onClick={onEmergency}
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            Urgence
          </Button>
        )}

        {/* Driver arrived visual cue */}
        {tripStatus === 'driver_arrived' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg animate-bounce">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="w-4 h-4" />
              Le chauffeur vous attend !
            </span>
          </div>
        )}
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

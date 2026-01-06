import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, Users, MapPin } from "lucide-react";
import { SharedRidePassenger } from "@/hooks/useActiveTrip";

interface SharedRidePassengersProps {
  passengers: SharedRidePassenger[];
  currentUserId?: string;
}

export const SharedRidePassengers = ({ passengers, currentUserId }: SharedRidePassengersProps) => {
  if (passengers.length === 0) return null;

  // Filtrer pour ne pas afficher l'utilisateur actuel
  const otherPassengers = passengers.filter(p => p.user_id !== currentUserId);

  return (
    <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-violet-500" />
          <span className="font-semibold">
            Co-passagers ({otherPassengers.length})
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-1 rounded-full">
          <Shield className="w-3 h-3" />
          Vérifiés
        </div>
      </div>

      <div className="space-y-3">
        {otherPassengers.map((passenger) => (
          <div 
            key={passenger.id} 
            className="flex items-center gap-3 p-3 rounded-xl bg-background/50"
          >
            <Avatar className="w-10 h-10 border-2 border-violet-500/30">
              <AvatarImage src={passenger.avatar_url || undefined} />
              <AvatarFallback className="bg-violet-500/20 text-violet-600 font-semibold">
                {passenger.first_name?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {passenger.first_name || 'Passager'}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span className="truncate">→ {passenger.dropoff_location || 'Destination'}</span>
              </div>
            </div>

            <div className="text-right text-xs text-muted-foreground">
              <p>{new Date(passenger.joined_at).toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-violet-500/20">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Shield className="w-3 h-3 text-green-500" />
          Identités vérifiées pour votre sécurité. En cas de problème, utilisez le bouton Urgence.
        </p>
      </div>
    </div>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation, MapPin, Phone, Clock, CheckCircle2 } from "lucide-react";
import type { ActiveDriverRide } from "@/types";

interface ActiveRideCardProps {
  ride: ActiveDriverRide;
  onUpdateStatus: () => void;
}

export const ActiveRideCard = ({ ride, onUpdateStatus }: ActiveRideCardProps) => {
  const getStatusLabel = () => {
    switch (ride.status) {
      case 'going_to_pickup': return 'En route pickup';
      case 'waiting': return 'Client attendu';
      case 'in_progress': return 'En course';
      default: return ride.status;
    }
  };

  const getActionButton = () => {
    switch (ride.status) {
      case 'going_to_pickup':
        return (
          <>
            <MapPin className="w-5 h-5 mr-2" />
            Je suis arrivé au point de départ
          </>
        );
      case 'waiting':
        return (
          <>
            <Navigation className="w-5 h-5 mr-2" />
            Démarrer la course
          </>
        );
      case 'in_progress':
        return (
          <>
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Terminer la course
          </>
        );
      default:
        return 'Action';
    }
  };

  return (
    <Card className="border-2 border-green-500">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Navigation className="w-5 h-5 text-green-500" />
            Course en cours
          </CardTitle>
          <Badge variant="outline" className="border-green-500 text-green-600">
            {getStatusLabel()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Client & ETA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{ride.clientName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{ride.clientName}</p>
              <p className="text-sm text-muted-foreground">{ride.fare.toLocaleString()} FCFA</p>
            </div>
          </div>
          <Button variant="outline" size="icon" className="rounded-full">
            <Phone className="w-4 h-4" />
          </Button>
        </div>

        {/* Destination highlight */}
        <div className="p-3 bg-muted rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">
              {ride.status === 'going_to_pickup' ? 'Point de récupération' : 'Destination'}
            </span>
            {ride.eta > 0 && (
              <Badge variant="secondary" className="ml-auto">
                <Clock className="w-3 h-3 mr-1" />
                {ride.eta} min
              </Badge>
            )}
          </div>
          <p className="font-semibold">
            {ride.status === 'going_to_pickup' ? ride.origin : ride.destination}
          </p>
        </div>

        {/* Action button */}
        <Button 
          className="w-full h-14 text-base"
          onClick={onUpdateStatus}
        >
          {getActionButton()}
        </Button>
      </CardContent>
    </Card>
  );
};

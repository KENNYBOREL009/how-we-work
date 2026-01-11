import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation, MapPin, Phone, Clock, CheckCircle2, MessageCircle } from "lucide-react";
import type { ActiveDriverRide } from "@/types";
import { PresenceValidation } from "./PresenceValidation";
import { RideChatDrawer } from "@/components/trip/RideChatDrawer";
import { useRideMessages } from "@/hooks/useRideMessages";
import { toast } from "sonner";

interface ActiveRideCardProps {
  ride: ActiveDriverRide;
  onUpdateStatus: () => void;
  clientLat?: number;
  clientLng?: number;
  clientPhone?: string;
}

export const ActiveRideCard = ({ 
  ride, 
  onUpdateStatus,
  clientLat = 4.0511, // Default Douala coords for demo
  clientLng = 9.7679,
  clientPhone
}: ActiveRideCardProps) => {
  const [showPresenceValidation, setShowPresenceValidation] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const { unreadCount } = useRideMessages(ride.id || null);

  const getStatusLabel = () => {
    switch (ride.status) {
      case 'going_to_pickup': return 'En route pickup';
      case 'waiting': return 'Client attendu';
      case 'in_progress': return 'En course';
      default: return ride.status;
    }
  };

  const handleArrivalClick = () => {
    // Show presence validation instead of direct status update
    setShowPresenceValidation(true);
  };

  const handlePresenceConfirmed = () => {
    setShowPresenceValidation(false);
    onUpdateStatus(); // Move to "in_progress"
    toast.success("Course démarrée !");
  };

  const handleCancelWithoutFees = () => {
    setShowPresenceValidation(false);
    toast.info("Course annulée sans frais - client non présenté");
    // TODO: Call cancel trip API with no penalty
  };

  const handleCancelWithPenalty = () => {
    setShowPresenceValidation(false);
    toast.warning("Course annulée avec pénalité");
    // TODO: Call cancel trip API with penalty
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

  // If showing presence validation
  if (showPresenceValidation && ride.status === 'going_to_pickup') {
    return (
      <Card className="border-2 border-green-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Navigation className="w-5 h-5 text-green-500" />
              Validation arrivée
            </CardTitle>
            <Badge variant="outline" className="border-green-500 text-green-600">
              {ride.clientName}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <PresenceValidation
            rideId={ride.id}
            clientLat={clientLat}
            clientLng={clientLng}
            onArrivalConfirmed={handlePresenceConfirmed}
            onCancelWithoutFees={handleCancelWithoutFees}
            onCancelWithPenalty={handleCancelWithPenalty}
          />
        </CardContent>
      </Card>
    );
  }

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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full"
              onClick={() => clientPhone && (window.location.href = `tel:${clientPhone}`)}
            >
              <Phone className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full relative"
              onClick={() => setShowChat(true)}
            >
              <MessageCircle className="w-4 h-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </div>
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
          onClick={ride.status === 'going_to_pickup' ? handleArrivalClick : onUpdateStatus}
        >
          {getActionButton()}
        </Button>

        {/* Chat Drawer */}
        {ride.id && (
          <RideChatDrawer
            open={showChat}
            onOpenChange={setShowChat}
            rideId={ride.id}
            otherPartyName={ride.clientName}
            otherPartyPhone={clientPhone}
            isDriver={true}
          />
        )}
      </CardContent>
    </Card>
  );
};
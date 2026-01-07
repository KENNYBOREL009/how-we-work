import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, CheckCircle2, XCircle } from "lucide-react";
import type { PendingRide } from "@/types";

interface RideRequestCardProps {
  ride: PendingRide;
  countdown: number;
  onAccept: () => void;
  onDecline: () => void;
}

export const RideRequestCard = ({ 
  ride, 
  countdown, 
  onAccept, 
  onDecline 
}: RideRequestCardProps) => {
  return (
    <Card className="border-2 border-primary animate-pulse-slow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" />
            Nouvelle course
          </CardTitle>
          <Badge variant="destructive" className="animate-pulse">
            {countdown}s
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Client info */}
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{ride.clientName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">{ride.clientName}</p>
            <p className="text-sm text-muted-foreground">
              {ride.isShared ? `Course partagée • ${ride.passengerCount} passager(s)` : 'Course privée'}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-primary">{ride.fare.toLocaleString()} FCFA</p>
            <p className="text-xs text-muted-foreground">{ride.distance}</p>
          </div>
        </div>

        {/* Route */}
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <div className="w-0.5 h-6 bg-border" />
            <div className="w-3 h-3 rounded-full bg-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-sm">{ride.origin}</p>
            <p className="text-sm font-medium">{ride.destination}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onDecline}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Refuser
          </Button>
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={onAccept}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Accepter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

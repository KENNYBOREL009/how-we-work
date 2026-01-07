import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, User, Navigation, Armchair, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PickupRequest {
  id: string;
  clientName: string;
  clientAvatar?: string;
  pickupDistance: number; // en mètres
  seatPreference: 'front' | 'back-window' | 'back-middle' | null;
  detourTime: number; // en minutes
  pickupLocation: string;
  isOnRoute: boolean;
}

interface PickupNotificationCardProps {
  request: PickupRequest;
  onAccept: () => void;
  onReject: () => void;
  className?: string;
}

const seatLabels: Record<string, string> = {
  'front': 'Place Avant',
  'back-window': 'Place Fenêtre',
  'back-middle': 'Place Centre',
};

const PickupNotificationCard: React.FC<PickupNotificationCardProps> = ({
  request,
  onAccept,
  onReject,
  className,
}) => {
  return (
    <Card className={cn(
      "overflow-hidden border-2 border-primary/20 shadow-xl animate-in slide-in-from-top duration-300",
      className
    )}>
      {/* Header avec animation pulse */}
      <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary-foreground">
          <div className="relative">
            <Navigation className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
          <span className="font-semibold text-sm">Nouvelle demande</span>
        </div>
        <Badge variant="secondary" className="bg-white/20 text-white border-0">
          <Clock className="w-3 h-3 mr-1" />
          +{request.detourTime} min
        </Badge>
      </div>

      <div className="p-4 space-y-4">
        {/* Info client */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
            {request.clientAvatar || request.clientName.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-base">{request.clientName}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-3 h-3" />
              Ramassage à {request.pickupDistance}m
            </div>
          </div>
        </div>

        {/* Détails de la demande */}
        <div className="bg-muted/50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Point de ramassage</span>
            <span className="font-medium">{request.pickupLocation}</span>
          </div>
          
          {request.seatPreference && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Armchair className="w-3 h-3" />
                Préférence siège
              </span>
              <Badge variant="outline" className="text-xs">
                {seatLabels[request.seatPreference]}
              </Badge>
            </div>
          )}
          
          {request.isOnRoute && (
            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 pt-1">
              <Check className="w-4 h-4" />
              Client sur votre trajet actuel
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={onReject}
            className="h-12 border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <X className="w-4 h-4 mr-2" />
            Refuser
          </Button>
          <Button
            onClick={onAccept}
            className="h-12"
            variant="premium"
          >
            <Check className="w-4 h-4 mr-2" />
            Accepter
          </Button>
        </div>
        
        <p className="text-xs text-center text-muted-foreground">
          L'itinéraire sera ajusté automatiquement
        </p>
      </div>
    </Card>
  );
};

export default PickupNotificationCard;

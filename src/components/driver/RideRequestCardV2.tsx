import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Car, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Users, 
  Clock,
  Calendar 
} from 'lucide-react';

interface RealRideRequest {
  id: string;
  type: 'signal' | 'scheduled';
  clientName: string;
  origin: string;
  destination: string;
  distance: string;
  fare: number;
  isShared: boolean;
  passengerCount: number;
  expiresIn: number;
  scheduledAt?: string;
}

interface RideRequestCardV2Props {
  request: RealRideRequest;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

export const RideRequestCardV2 = ({
  request,
  onAccept,
  onDecline,
}: RideRequestCardV2Props) => {
  const isScheduled = request.type === 'scheduled';
  const isExpiringSoon = request.expiresIn < 60;

  const formatScheduledTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className={`border-2 ${isScheduled ? 'border-blue-500' : 'border-primary'} ${isExpiringSoon ? 'animate-pulse' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {isScheduled ? (
              <>
                <Calendar className="w-5 h-5 text-blue-500" />
                Réservation
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5 text-primary" />
                Signal client
              </>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {isScheduled && request.scheduledAt && (
              <Badge variant="outline" className="text-blue-500 border-blue-500">
                <Clock className="w-3 h-3 mr-1" />
                {formatScheduledTime(request.scheduledAt)}
              </Badge>
            )}
            <Badge 
              variant={isExpiringSoon ? 'destructive' : 'secondary'}
              className={isExpiringSoon ? 'animate-pulse' : ''}
            >
              {Math.floor(request.expiresIn / 60)}:{(request.expiresIn % 60).toString().padStart(2, '0')}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Client info */}
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className={isScheduled ? 'bg-blue-100 text-blue-600' : ''}>
              {request.clientName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">{request.clientName}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              {request.passengerCount} passager(s)
              {request.isShared && ' • Partagé'}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-primary">{request.fare.toLocaleString()} FCFA</p>
            <p className="text-xs text-muted-foreground">{request.distance}</p>
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
            <p className="text-sm">{request.origin}</p>
            <p className="text-sm font-medium">{request.destination}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onDecline(request.id)}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Ignorer
          </Button>
          <Button
            className={`flex-1 ${isScheduled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
            onClick={() => onAccept(request.id)}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {isScheduled ? 'Confirmer' : 'Prendre'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Building2, Car, User, Phone, Calendar, Percent } from 'lucide-react';
import type { DriverAssignment } from '@/types';

interface FleetAssignmentCardProps {
  assignment: DriverAssignment | null;
  vehiclePlate?: string;
  ownerName?: string;
  ownerPhone?: string;
}

export const FleetAssignmentCard = ({
  assignment,
  vehiclePlate = 'CE-XXX-XX',
  ownerName = 'Propriétaire',
  ownerPhone,
}: FleetAssignmentCardProps) => {
  if (!assignment) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-500" />
            Affectation Flotte
          </CardTitle>
          <Badge variant={assignment.is_active ? 'default' : 'secondary'}>
            {assignment.is_active ? 'Actif' : 'Inactif'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Propriétaire */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {ownerName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">{ownerName}</p>
            {ownerPhone && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {ownerPhone}
              </p>
            )}
          </div>
        </div>

        {/* Véhicule et détails */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Car className="w-4 h-4 text-muted-foreground" />
            <span>{vehiclePlate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Percent className="w-4 h-4 text-muted-foreground" />
            <span>Commission: {assignment.commission_rate || 20}%</span>
          </div>
          <div className="flex items-center gap-2 text-sm col-span-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>Depuis le {formatDate(assignment.start_date)}</span>
          </div>
        </div>

        {/* Shift type */}
        {assignment.shift_type && (
          <Badge variant="outline" className="w-full justify-center">
            {assignment.shift_type === 'day' && 'Équipe de jour'}
            {assignment.shift_type === 'night' && 'Équipe de nuit'}
            {assignment.shift_type === 'full' && 'Journée complète'}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

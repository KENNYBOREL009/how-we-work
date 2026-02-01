import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { AdminScheduledTrip } from '@/hooks/useAdminExtended';

interface AdminScheduledTripsTableProps {
  trips: AdminScheduledTrip[];
}

const AdminScheduledTripsTable = ({ trips }: AdminScheduledTripsTableProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500">Confirmée</Badge>;
      case 'matched':
        return <Badge className="bg-blue-500">Assignée</Badge>;
      case 'completed':
        return <Badge variant="outline">Terminée</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulée</Badge>;
      default:
        return <Badge variant="secondary">En attente</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-4 w-4" />
          Réservations programmées ({trips.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Heure</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Chauffeur</TableHead>
                <TableHead>Trajet</TableHead>
                <TableHead className="text-right">Tarif</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucune réservation programmée
                  </TableCell>
                </TableRow>
              ) : (
                trips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium">
                          {format(new Date(trip.scheduled_at), 'dd MMM yyyy', { locale: fr })}
                        </div>
                        <div className="text-muted-foreground">
                          {format(new Date(trip.scheduled_at), 'HH:mm', { locale: fr })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{trip.client_name || '-'}</TableCell>
                    <TableCell>{trip.driver_name || 'Non assigné'}</TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="text-sm truncate">
                        <span className="text-muted-foreground">{trip.origin}</span>
                        <span className="mx-1">→</span>
                        <span>{trip.destination}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {trip.estimated_fare.toLocaleString()} FCFA
                    </TableCell>
                    <TableCell>{getStatusBadge(trip.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminScheduledTripsTable;

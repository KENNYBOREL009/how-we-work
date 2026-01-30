import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, MapPin, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { AdminTrip } from '@/hooks/useAdmin';

interface AdminTripsTableProps {
  trips: AdminTrip[];
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-500/10 text-green-600 border-green-500/20',
  active: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  in_progress: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
  pending: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  searching: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

const tripTypeLabels: Record<string, string> = {
  standard: 'Standard',
  shared: 'Partagé',
  private: 'Privé',
  taxi: 'Taxi',
  'confort-partage': 'Confort Partagé',
  scheduled: 'Réservé',
};

const AdminTripsTable = ({ trips }: AdminTripsTableProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTrips = trips.filter((trip) => {
    const query = searchQuery.toLowerCase();
    return (
      trip.origin?.toLowerCase().includes(query) ||
      trip.destination?.toLowerCase().includes(query) ||
      trip.user_name?.toLowerCase().includes(query) ||
      trip.status.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher origine, destination, client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary">{filteredTrips.length} trajets</Badge>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Client</TableHead>
              <TableHead>Trajet</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Tarif</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Aucun trajet trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredTrips.map((trip) => (
                <TableRow key={trip.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">
                        {trip.user_name && trip.user_name.trim() !== '' ? trip.user_name : 'Anonyme'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                        {trip.user_id.slice(0, 8)}...
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm max-w-[200px]">
                      <MapPin className="h-3 w-3 text-green-500 shrink-0" />
                      <span className="truncate">{trip.origin ?? '-'}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{trip.destination ?? '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {tripTypeLabels[trip.trip_type] ?? trip.trip_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {trip.fare ? `${trip.fare.toLocaleString()} FCFA` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${statusColors[trip.status] ?? ''}`}
                    >
                      {trip.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(trip.created_at), 'dd MMM HH:mm', { locale: fr })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminTripsTable;

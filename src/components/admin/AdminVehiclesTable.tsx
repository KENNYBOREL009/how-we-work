import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Car, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { AdminVehicle } from '@/hooks/useAdmin';

interface AdminVehiclesTableProps {
  vehicles: AdminVehicle[];
}

const statusColors: Record<string, string> = {
  available: 'bg-green-500/10 text-green-600 border-green-500/20',
  busy: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  offline: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  full: 'bg-red-500/10 text-red-600 border-red-500/20',
  private: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

const typeColors: Record<string, string> = {
  taxi: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  vtc: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  bus: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
};

const AdminVehiclesTable = ({ vehicles }: AdminVehiclesTableProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVehicles = vehicles.filter((vehicle) => {
    const query = searchQuery.toLowerCase();
    return (
      vehicle.plate_number.toLowerCase().includes(query) ||
      vehicle.driver_name?.toLowerCase().includes(query) ||
      vehicle.destination?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher plaque, chauffeur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary">{filteredVehicles.length} véhicules</Badge>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Véhicule</TableHead>
              <TableHead>Chauffeur</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Passagers</TableHead>
              <TableHead>Créé le</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Aucun véhicule trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Car className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{vehicle.plate_number}</p>
                        <Badge
                          variant="outline"
                          className={`text-xs mt-1 ${typeColors[vehicle.vehicle_type] ?? ''}`}
                        >
                          {vehicle.vehicle_type}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {vehicle.driver_name && vehicle.driver_name.trim() !== '' ? (
                      vehicle.driver_name
                    ) : (
                      <span className="text-muted-foreground">Non assigné</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${statusColors[vehicle.status] ?? statusColors.offline}`}
                    >
                      {vehicle.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {vehicle.destination ? (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-[120px]">{vehicle.destination}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span>
                        {vehicle.current_passengers}/{vehicle.capacity}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(vehicle.created_at), 'dd MMM yyyy', { locale: fr })}
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

export default AdminVehiclesTable;

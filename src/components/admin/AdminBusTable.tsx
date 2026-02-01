import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bus, MapPin, Route } from 'lucide-react';
import type { AdminBusRoute, AdminBusStop } from '@/hooks/useAdminExtended';

interface AdminBusTableProps {
  routes: AdminBusRoute[];
  stops: AdminBusStop[];
}

const AdminBusTable = ({ routes, stops }: AdminBusTableProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bus className="h-4 w-4" />
          Infrastructure Bus
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pt-2">
        <Tabs defaultValue="routes" className="w-full">
          <div className="px-4">
            <TabsList className="grid w-full max-w-xs grid-cols-2">
              <TabsTrigger value="routes" className="text-xs">
                <Route className="h-3 w-3 mr-1" />
                Lignes ({routes.length})
              </TabsTrigger>
              <TabsTrigger value="stops" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                Arrêts ({stops.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="routes" className="mt-2">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ligne</TableHead>
                    <TableHead>Trajet</TableHead>
                    <TableHead className="text-center">Arrêts</TableHead>
                    <TableHead className="text-center">Horaires</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Aucune ligne de bus
                      </TableCell>
                    </TableRow>
                  ) : (
                    routes.map((route) => (
                      <TableRow key={route.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: route.color || '#888' }}
                            />
                            <span className="font-medium">{route.route_number || route.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="text-muted-foreground">
                            {route.start_point} → {route.end_point}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{route.stops_count}</TableCell>
                        <TableCell className="text-center">{route.schedules_count}</TableCell>
                        <TableCell>
                          <Badge variant={route.is_active ? 'default' : 'secondary'}>
                            {route.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="stops" className="mt-2">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead className="text-center">Lignes</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stops.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Aucun arrêt de bus
                      </TableCell>
                    </TableRow>
                  ) : (
                    stops.map((stop) => (
                      <TableRow key={stop.id}>
                        <TableCell className="font-medium">{stop.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {stop.address || `${stop.latitude.toFixed(4)}, ${stop.longitude.toFixed(4)}`}
                        </TableCell>
                        <TableCell className="text-center">{stop.routes_count}</TableCell>
                        <TableCell>
                          <Badge variant={stop.is_active ? 'default' : 'secondary'}>
                            {stop.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminBusTable;

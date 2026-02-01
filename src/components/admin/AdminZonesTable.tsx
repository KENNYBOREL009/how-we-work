import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPinned, TrendingUp, Signal } from 'lucide-react';
import type { AdminCityZone } from '@/hooks/useAdminExtended';

interface AdminZonesTableProps {
  zones: AdminCityZone[];
}

const AdminZonesTable = ({ zones }: AdminZonesTableProps) => {
  const getDemandLevel = (score: number) => {
    if (score >= 70) return { label: 'Élevée', color: 'destructive' };
    if (score >= 40) return { label: 'Moyenne', color: 'default' };
    return { label: 'Faible', color: 'secondary' };
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPinned className="h-4 w-4" />
          Zones de la ville ({zones.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zone</TableHead>
                <TableHead>Coordonnées</TableHead>
                <TableHead>Demande</TableHead>
                <TableHead className="text-center">Signaux actifs</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Aucune zone configurée
                  </TableCell>
                </TableRow>
              ) : (
                zones.map((zone) => {
                  const demandInfo = getDemandLevel(zone.demand_score || 0);
                  return (
                    <TableRow key={zone.id}>
                      <TableCell className="font-medium">{zone.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {zone.center_lat.toFixed(4)}, {zone.center_lng.toFixed(4)}
                        <span className="ml-2 text-xs">({zone.radius_km}km)</span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 max-w-[120px]">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {zone.demand_score || 0}%
                            </span>
                            <Badge variant={demandInfo.color as 'default' | 'secondary' | 'destructive'} className="text-[10px] px-1">
                              {demandInfo.label}
                            </Badge>
                          </div>
                          <Progress value={zone.demand_score || 0} className="h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Signal className="h-3 w-3 text-muted-foreground" />
                          {zone.active_signals_count || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={zone.is_active ? 'default' : 'secondary'}>
                          {zone.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminZonesTable;

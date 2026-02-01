import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, CheckCircle, XCircle, Car, Users } from 'lucide-react';
import type { AdminFleetOwner } from '@/hooks/useAdminExtended';

interface AdminFleetTableProps {
  fleetOwners: AdminFleetOwner[];
  onToggleVerification: (id: string) => void;
}

const AdminFleetTable = ({ fleetOwners, onToggleVerification }: AdminFleetTableProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4" />
          Propriétaires de flotte ({fleetOwners.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entreprise</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-center">Véhicules</TableHead>
                <TableHead className="text-center">Chauffeurs</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fleetOwners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucun propriétaire de flotte
                  </TableCell>
                </TableRow>
              ) : (
                fleetOwners.map((owner) => (
                  <TableRow key={owner.id}>
                    <TableCell className="font-medium">
                      {owner.company_name || 'Sans nom'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{owner.contact_email}</div>
                        <div className="text-muted-foreground">{owner.contact_phone}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Car className="h-3 w-3 text-muted-foreground" />
                        {owner.vehicle_count}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {owner.driver_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge variant={owner.is_verified ? 'default' : 'secondary'}>
                          {owner.is_verified ? 'Vérifié' : 'Non vérifié'}
                        </Badge>
                        {!owner.is_active && (
                          <Badge variant="destructive">Inactif</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={owner.is_verified ? 'outline' : 'default'}
                        onClick={() => onToggleVerification(owner.id)}
                      >
                        {owner.is_verified ? (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Retirer
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Vérifier
                          </>
                        )}
                      </Button>
                    </TableCell>
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

export default AdminFleetTable;

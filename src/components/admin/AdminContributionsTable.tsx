import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, Check, X, ThumbsUp, ThumbsDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { AdminContribution } from '@/hooks/useAdminExtended';

interface AdminContributionsTableProps {
  contributions: AdminContribution[];
  onValidate: (id: string, approve: boolean) => void;
}

const AdminContributionsTable = ({ contributions, onValidate }: AdminContributionsTableProps) => {
  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      local_name: 'Nom local',
      road_trace: 'Tracé route',
      error_report: 'Signalement',
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validated':
        return <Badge className="bg-green-500">Validée</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejetée</Badge>;
      default:
        return <Badge variant="secondary">En attente</Badge>;
    }
  };

  const pendingContributions = contributions.filter((c) => c.status === 'pending');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-4 w-4" />
          Contributions cartographiques
          {pendingContributions.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingContributions.length} en attente
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contributeur</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead className="text-center">Votes</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contributions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucune contribution
                  </TableCell>
                </TableRow>
              ) : (
                contributions.map((contribution) => (
                  <TableRow key={contribution.id}>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{contribution.contributor_name || 'Anonyme'}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(contribution.created_at), 'dd MMM yyyy', { locale: fr })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel(contribution.contribution_type)}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="text-sm truncate">
                        {contribution.local_name || contribution.official_name || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <span className="flex items-center gap-0.5 text-green-600">
                          <ThumbsUp className="h-3 w-3" />
                          {contribution.votes_positive || 0}
                        </span>
                        <span className="flex items-center gap-0.5 text-red-600">
                          <ThumbsDown className="h-3 w-3" />
                          {contribution.votes_negative || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(contribution.status)}</TableCell>
                    <TableCell>
                      {contribution.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2"
                            onClick={() => onValidate(contribution.id, true)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-destructive"
                            onClick={() => onValidate(contribution.id, false)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
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

export default AdminContributionsTable;

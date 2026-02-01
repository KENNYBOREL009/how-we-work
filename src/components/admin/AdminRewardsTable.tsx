import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gift, Star, Package } from 'lucide-react';
import type { AdminReward } from '@/hooks/useAdminExtended';

interface AdminRewardsTableProps {
  rewards: AdminReward[];
}

const AdminRewardsTable = ({ rewards }: AdminRewardsTableProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gift className="h-4 w-4" />
          Récompenses ({rewards.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Récompense</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-center">Points</TableHead>
                <TableHead className="text-right">Valeur</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center">Échanges</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rewards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Aucune récompense configurée
                  </TableCell>
                </TableRow>
              ) : (
                rewards.map((reward) => (
                  <TableRow key={reward.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                          <Star className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{reward.name}</div>
                          {reward.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {reward.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{reward.category}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {reward.points_cost.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {reward.value_fcfa ? `${reward.value_fcfa.toLocaleString()} FCFA` : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Package className="h-3 w-3 text-muted-foreground" />
                        {reward.stock ?? '∞'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{reward.redemptions_count}</TableCell>
                    <TableCell>
                      <Badge variant={reward.is_active ? 'default' : 'secondary'}>
                        {reward.is_active ? 'Active' : 'Inactive'}
                      </Badge>
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

export default AdminRewardsTable;

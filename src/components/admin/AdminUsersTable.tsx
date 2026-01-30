import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, Shield, UserPlus, Search, UserMinus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { AdminUser } from '@/hooks/useAdmin';

interface AdminUsersTableProps {
  users: AdminUser[];
  onAssignRole: (userId: string, role: 'admin' | 'moderator' | 'user' | 'driver' | 'fleet_owner') => void;
  onRemoveRole: (userId: string, role: 'admin' | 'moderator' | 'user' | 'driver' | 'fleet_owner') => void;
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-500/10 text-red-600 border-red-500/20',
  moderator: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  driver: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  fleet_owner: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  user: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

const AdminUsersTable = ({ users, onAssignRole, onRemoveRole }: AdminUsersTableProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.toLowerCase();
    const phone = user.phone_number?.toLowerCase() ?? '';
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || phone.includes(query);
  });

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const f = firstName?.[0] ?? '';
    const l = lastName?.[0] ?? '';
    return (f + l).toUpperCase() || '?';
  };

  const allRoles = ['admin', 'moderator', 'driver', 'fleet_owner', 'user'] as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary">{filteredUsers.length} utilisateurs</Badge>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Utilisateur</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Rôles</TableHead>
              <TableHead>Inscrit le</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(user.first_name, user.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {user.first_name ?? ''} {user.last_name ?? ''}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {user.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {user.phone_number ?? '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Badge
                            key={role}
                            variant="outline"
                            className={`text-xs ${roleColors[role] ?? roleColors.user}`}
                          >
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className={roleColors.user}>
                          user
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(user.created_at), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Ajouter un rôle
                        </DropdownMenuLabel>
                        {allRoles
                          .filter((role) => !user.roles?.includes(role))
                          .map((role) => (
                            <DropdownMenuItem
                              key={`add-${role}`}
                              onClick={() => onAssignRole(user.id, role)}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              {role}
                            </DropdownMenuItem>
                          ))}
                        {user.roles && user.roles.length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="flex items-center gap-2 text-destructive">
                              <UserMinus className="h-4 w-4" />
                              Retirer un rôle
                            </DropdownMenuLabel>
                            {user.roles.map((role) => (
                              <DropdownMenuItem
                                key={`remove-${role}`}
                                onClick={() => onRemoveRole(user.id, role as any)}
                                className="text-destructive"
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                {role}
                              </DropdownMenuItem>
                            ))}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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

export default AdminUsersTable;

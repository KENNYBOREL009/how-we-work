import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  RefreshCw, Shield, Users, Car, MapPin, ArrowLeft, 
  Building2, Bus, MapPinned, Gift, Wallet, CalendarClock 
} from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { useAdminExtended } from '@/hooks/useAdminExtended';
import { useAuth } from '@/hooks/useAuth';
import { 
  AdminStatsCards, 
  AdminUsersTable, 
  AdminVehiclesTable, 
  AdminTripsTable,
  AdminFleetTable,
  AdminBusTable,
  AdminZonesTable,
  AdminContributionsTable,
  AdminFinanceCard,
  AdminScheduledTripsTable,
  AdminRewardsTable,
} from '@/components/admin';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    isAdmin,
    isLoading,
    stats,
    users,
    vehicles,
    trips,
    assignRole,
    removeRole,
    refreshData,
  } = useAdmin();

  const {
    fleetOwners,
    busRoutes,
    busStops,
    cityZones,
    contributions,
    scheduledTrips,
    rewards,
    financialStats,
    isLoading: extendedLoading,
    refreshAllExtendedData,
    toggleFleetVerification,
    validateContribution,
  } = useAdminExtended();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  // Load extended data when admin
  useEffect(() => {
    if (isAdmin) {
      refreshAllExtendedData();
    }
  }, [isAdmin, refreshAllExtendedData]);

  const handleRefresh = async () => {
    await Promise.all([refreshData(), refreshAllExtendedData()]);
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32 mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="p-4 rounded-full bg-destructive/10 inline-block">
            <Shield className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Accès refusé</h1>
          <p className="text-muted-foreground max-w-sm">
            Vous n'avez pas les permissions nécessaires pour accéder au tableau de bord administrateur.
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Admin Lokebo</h1>
                <p className="text-xs text-muted-foreground">Centre de contrôle</p>
              </div>
            </div>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={extendedLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${extendedLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Stats */}
        <AdminStatsCards stats={stats} />

        {/* Finance Overview */}
        <AdminFinanceCard stats={financialStats} />

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="users" className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Utilisateurs</span>
              </TabsTrigger>
              <TabsTrigger value="vehicles" className="flex items-center gap-1.5">
                <Car className="h-4 w-4" />
                <span className="hidden sm:inline">Véhicules</span>
              </TabsTrigger>
              <TabsTrigger value="trips" className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Courses</span>
              </TabsTrigger>
              <TabsTrigger value="reservations" className="flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4" />
                <span className="hidden sm:inline">Réservations</span>
              </TabsTrigger>
              <TabsTrigger value="fleet" className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Flottes</span>
              </TabsTrigger>
              <TabsTrigger value="bus" className="flex items-center gap-1.5">
                <Bus className="h-4 w-4" />
                <span className="hidden sm:inline">Bus</span>
              </TabsTrigger>
              <TabsTrigger value="zones" className="flex items-center gap-1.5">
                <MapPinned className="h-4 w-4" />
                <span className="hidden sm:inline">Zones</span>
              </TabsTrigger>
              <TabsTrigger value="contributions" className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Contributions</span>
              </TabsTrigger>
              <TabsTrigger value="rewards" className="flex items-center gap-1.5">
                <Gift className="h-4 w-4" />
                <span className="hidden sm:inline">Récompenses</span>
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="users" className="mt-4">
            <AdminUsersTable
              users={users}
              onAssignRole={assignRole}
              onRemoveRole={removeRole}
            />
          </TabsContent>

          <TabsContent value="vehicles" className="mt-4">
            <AdminVehiclesTable vehicles={vehicles} />
          </TabsContent>

          <TabsContent value="trips" className="mt-4">
            <AdminTripsTable trips={trips} />
          </TabsContent>

          <TabsContent value="reservations" className="mt-4">
            <AdminScheduledTripsTable trips={scheduledTrips} />
          </TabsContent>

          <TabsContent value="fleet" className="mt-4">
            <AdminFleetTable 
              fleetOwners={fleetOwners} 
              onToggleVerification={toggleFleetVerification} 
            />
          </TabsContent>

          <TabsContent value="bus" className="mt-4">
            <AdminBusTable routes={busRoutes} stops={busStops} />
          </TabsContent>

          <TabsContent value="zones" className="mt-4">
            <AdminZonesTable zones={cityZones} />
          </TabsContent>

          <TabsContent value="contributions" className="mt-4">
            <AdminContributionsTable 
              contributions={contributions} 
              onValidate={validateContribution} 
            />
          </TabsContent>

          <TabsContent value="rewards" className="mt-4">
            <AdminRewardsTable rewards={rewards} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;

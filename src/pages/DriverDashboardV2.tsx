import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDriverMode } from '@/hooks/useDriverMode';
import { useDriverProfile } from '@/hooks/useDriverProfile';
import { useAuth } from '@/hooks/useAuth';
import { useDriverRealStats } from '@/hooks/useDriverRealStats';
import { useClientSignals } from '@/hooks/useClientSignals';
import { useDriverExpenses } from '@/hooks/useDriverExpenses';
import {
  DriverStatsGrid,
  ActiveRideCard,
  ReliabilityScoreCard,
} from '@/components/driver';
import { SmartHotspotMap } from '@/components/driver/SmartHotspotMap';
import { AITrafficPanel } from '@/components/driver/AITrafficPanel';
import { RideRequestCardV2 } from '@/components/driver/RideRequestCardV2';
import { DriverProfileSetup } from '@/components/driver/DriverProfileSetup';
import { DailyRentalEarnings, CommissionEarnings, OwnerEarnings } from '@/components/driver/earnings';
import { DriverWorkZoneSelector } from '@/components/smart-routine';
import { useSmartRoutine } from '@/hooks/useSmartRoutine';
import {
  Car,
  Home,
  Wallet,
  Brain,
  Calendar,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

const DriverDashboardV2 = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const {
    profile,
    updateProfile,
    saveProfile,
    isLoading: profileLoading,
    isConfigured,
  } = useDriverProfile();

  const {
    isOnline,
    pendingRide,
    activeRide,
    acceptCountdown,
    stats,
    reliabilityScore,
    toggleOnline,
    acceptRide,
    declineRide,
    updateRideStatus,
  } = useDriverMode();

  const { stats: realStats, rideRequests } = useDriverRealStats();
  const { totalPeopleWaiting } = useClientSignals();
  const { totalExpenses } = useDriverExpenses();
  const { zones, predictions, driverIntention, setDriverWorkZone } = useSmartRoutine();
  
  // Use real stats if available, otherwise fallback to demo stats
  const displayStats = realStats.todayTrips > 0 ? realStats : stats;

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'C';

  // Show setup screen if not configured
  if (!profileLoading && !isConfigured) {
    return (
      <DriverProfileSetup 
        onComplete={(newProfile) => {
          updateProfile({ ...newProfile, isConfigured: true });
          saveProfile();
        }}
      />
    );
  }

  // Loading state
  if (profileLoading) {
    return (
      <MobileLayout showNav={false} showThemeToggle={false}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showNav={false} showThemeToggle={false}>
      <div className="flex flex-col h-full bg-background">
        {/* Header avec toggle online */}
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                {userInitial}
              </div>
              <div>
                <p className="font-medium">Mode Chauffeur</p>
                <Badge variant="outline" className="text-xs">
                  {profile.employmentType === 'owner' ? (
                    <>
                      <Car className="w-3 h-3 mr-1" />
                      Propriétaire
                    </>
                  ) : (
                    <>
                      {profile.paymentModel === 'daily_rental' ? '📅 Location' : '📊 Commission'}
                    </>
                  )}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {isOnline ? 'En ligne' : 'Hors ligne'}
                </p>
                <p className="text-sm font-medium text-primary">
                  {reliabilityScore?.reliability_score?.toFixed(0) || 100}/100
                </p>
              </div>
              <Switch checked={isOnline} onCheckedChange={toggleOnline} />
            </div>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold">{displayStats.todayTrips}</p>
              <p className="text-xs text-muted-foreground">Courses</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold">
                {(displayStats.todayEarnings / 1000).toFixed(1)}k
              </p>
              <p className="text-xs text-muted-foreground">FCFA</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold">{displayStats.rating}</p>
              <p className="text-xs text-muted-foreground">Note</p>
            </div>
            <div className="p-2 rounded-lg bg-orange-500/10">
              <p className="text-lg font-bold text-orange-500">{totalPeopleWaiting}</p>
              <p className="text-xs text-muted-foreground">Signaux</p>
            </div>
          </div>
        </div>

        {/* Demandes de courses */}
        {rideRequests.length > 0 && !activeRide && (
          <div className="p-4 border-b bg-primary/5">
            <RideRequestCardV2
              request={{
                ...rideRequests[0],
                expiresIn: rideRequests[0].expiresIn || 300,
              }}
              onAccept={() => toast.success('Course acceptée !')}
              onDecline={() => toast.info('Course ignorée')}
            />
          </div>
        )}

        {/* Course active */}
        {activeRide && (
          <div className="p-4 border-b">
            <ActiveRideCard ride={activeRide} onUpdateStatus={updateRideStatus} />
          </div>
        )}

        {/* Onglets principaux */}
        {!activeRide && !pendingRide && (
          <Tabs defaultValue="home" className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-4 mx-4 mt-2">
              <TabsTrigger value="home" className="flex flex-col gap-1 py-2">
                <Home className="w-4 h-4" />
                <span className="text-xs">Accueil</span>
              </TabsTrigger>
              <TabsTrigger value="earnings" className="flex flex-col gap-1 py-2">
                <Wallet className="w-4 h-4" />
                <span className="text-xs">Gains</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex flex-col gap-1 py-2">
                <Brain className="w-4 h-4" />
                <span className="text-xs">IA</span>
              </TabsTrigger>
              <TabsTrigger value="planning" className="flex flex-col gap-1 py-2">
                <Calendar className="w-4 h-4" />
                <span className="text-xs">Planning</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              {/* TAB ACCUEIL */}
              <TabsContent value="home" className="p-4 space-y-4 mt-0">
                {isOnline && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">📍 Hotspots en temps réel</h3>
                    <SmartHotspotMap height="200px" />
                  </div>
                )}

                {reliabilityScore && (
                  <ReliabilityScoreCard score={reliabilityScore} />
                )}

                <DriverStatsGrid stats={stats} />

                {!isOnline && (
                  <div className="text-center py-8">
                    <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground">
                      Passez en ligne pour recevoir des courses
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* TAB GAINS - Adaptatif selon le profil */}
              <TabsContent value="earnings" className="p-4 mt-0">
                {profile.employmentType === 'employee' ? (
                  profile.paymentModel === 'daily_rental' ? (
                    <DailyRentalEarnings
                      dailyRentalAmount={profile.dailyRentalAmount}
                      todayEarnings={displayStats.todayEarnings}
                      todayTrips={displayStats.todayTrips}
                      ownerName={profile.fleetOwnerName}
                    />
                  ) : (
                    <CommissionEarnings
                      commissionRate={profile.commissionRate}
                      todayEarnings={displayStats.todayEarnings}
                      todayTrips={displayStats.todayTrips}
                      ownerName={profile.fleetOwnerName}
                    />
                  )
                ) : (
                  <OwnerEarnings
                    todayEarnings={displayStats.todayEarnings}
                    todayTrips={displayStats.todayTrips}
                    todayExpenses={totalExpenses}
                    fleetVehicleId={profile.fleetVehicleId}
                    weeklyData={[
                      { day: 'Lun', earnings: 25000, expenses: 5000 },
                      { day: 'Mar', earnings: 32000, expenses: 3000 },
                      { day: 'Mer', earnings: 28000, expenses: 8000 },
                      { day: 'Jeu', earnings: 35000, expenses: 2000 },
                      { day: 'Ven', earnings: 42000, expenses: 6000 },
                      { day: 'Sam', earnings: 38000, expenses: 4000 },
                      { day: 'Dim', earnings: displayStats.todayEarnings, expenses: totalExpenses },
                    ]}
                  />
                )}
              </TabsContent>

              {/* TAB IA */}
              <TabsContent value="ai" className="p-4 space-y-4 mt-0">
                <AITrafficPanel 
                  onZoneClick={(lat, lng) => {
                    toast.info(`Zone sélectionnée`, {
                      description: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
                    });
                  }}
                />

                <DriverWorkZoneSelector
                  zones={zones}
                  currentIntention={driverIntention}
                  predictions={predictions}
                  onSave={setDriverWorkZone}
                />
              </TabsContent>

              {/* TAB PLANNING */}
              <TabsContent value="planning" className="p-4 space-y-4 mt-0">
                <Button
                  variant="outline"
                  className="w-full justify-between h-14"
                  onClick={() => navigate('/driver/planning')}
                >
                  <span>📅 Gérer mes disponibilités</span>
                  <ChevronRight className="w-5 h-5" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-between h-14"
                  onClick={() => navigate('/driver/reports')}
                >
                  <span>📊 Rapports quotidiens</span>
                  <ChevronRight className="w-5 h-5" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-between h-14"
                  onClick={() => navigate('/driver/analytics')}
                >
                  <span>📈 Statistiques détaillées</span>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </TabsContent>
            </div>
          </Tabs>
        )}

        {/* Bottom nav */}
        <div className="p-4 border-t bg-background flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/')}
          >
            Mode passager
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/driver/cockpit')}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default DriverDashboardV2;

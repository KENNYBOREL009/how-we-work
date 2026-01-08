import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDriverMode } from '@/hooks/useDriverMode';
import { useDriverOperatingMode } from '@/hooks/useDriverOperatingMode';
import { useAuth } from '@/hooks/useAuth';
import { useFleetAssignment } from '@/hooks/useFleetAssignment';
import { useDriverRealStats } from '@/hooks/useDriverRealStats';
import { useClientSignals } from '@/hooks/useClientSignals';
import {
  DriverStatsGrid,
  ActiveRideCard,
  ReliabilityScoreCard,
  InterfaceLevelSelector,
} from '@/components/driver';
import { OperatingModeSelector } from '@/components/driver/OperatingModeSelector';
import { DailyEarningsCard } from '@/components/driver/DailyEarningsCard';
import { FleetAssignmentCard } from '@/components/driver/FleetAssignmentCard';
import { QuickExpenseButton } from '@/components/driver/QuickExpenseButton';
import { SmartHotspotMap } from '@/components/driver/SmartHotspotMap';
import { AITrafficPanel } from '@/components/driver/AITrafficPanel';
import { RideRequestCardV2 } from '@/components/driver/RideRequestCardV2';
import { DriverWorkZoneSelector, DemandHeatmap } from '@/components/smart-routine';
import { useSmartRoutine } from '@/hooks/useSmartRoutine';
import {
  Car,
  Clock,
  Users,
  Settings,
  TrendingUp,
  FileText,
  ChevronRight,
  Building2,
  Key,
  Brain,
  MapPin,
  Compass,
} from 'lucide-react';
import { toast } from 'sonner';

const DriverDashboardV2 = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showModeSelector, setShowModeSelector] = useState(false);

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

  const {
    operatingMode,
    driverProfile,
    dailySummary,
    modeConfig,
    setMode,
    isLoading: modeLoading,
  } = useDriverOperatingMode();

  const { assignment, hasFleetAssignment } = useFleetAssignment();
  const { stats: realStats, rideRequests, nextPendingRide } = useDriverRealStats();
  const { totalPeopleWaiting, hotspotCount } = useClientSignals();
const { zones, predictions, driverIntention, setDriverWorkZone, fetchPredictions } = useSmartRoutine();
  const [selectedHour, setSelectedHour] = useState(7);
  
  // Use real stats if available, otherwise fallback to demo stats
  const displayStats = realStats.todayTrips > 0 ? realStats : stats;

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'C';

  // Montre le sélecteur de mode si aucun mode n'est défini
  useEffect(() => {
    if (!modeLoading && !operatingMode) {
      setShowModeSelector(true);
    }
  }, [modeLoading, operatingMode]);

  // Mode selector modal
  if (showModeSelector) {
    return (
      <MobileLayout showNav={false} showThemeToggle={false}>
        <div className="flex flex-col h-full bg-background p-4">
          <OperatingModeSelector
            currentMode={operatingMode}
            onSelectMode={(mode) => {
              setMode(mode);
              setShowModeSelector(false);
            }}
          />
          {operatingMode && (
            <Button
              className="mt-4"
              onClick={() => setShowModeSelector(false)}
            >
              Continuer
            </Button>
          )}
        </div>
      </MobileLayout>
    );
  }

  const ModeIcon =
    operatingMode === 'fleet_assigned'
      ? Building2
      : operatingMode === 'independent_owner'
      ? Car
      : Key;

  return (
    <MobileLayout showNav={false} showThemeToggle={false}>
      <div className="flex flex-col h-full bg-background">
        {/* Interface Level Selector - Compact */}
        <div className="px-4 py-2 border-b bg-muted/30">
          <InterfaceLevelSelector compact />
        </div>

        {/* Header avec toggle online et mode badge */}
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                {userInitial}
              </div>
              <div>
                <p className="font-medium">Mode Chauffeur</p>
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer"
                  onClick={() => setShowModeSelector(true)}
                >
                  <ModeIcon className="w-3 h-3 mr-1" />
                  {modeConfig?.label || 'Configurer'}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Demandes de courses réelles */}
          {rideRequests.length > 0 && !activeRide && (
            <div className="p-4">
              <RideRequestCardV2
                request={{
                  ...rideRequests[0],
                  expiresIn: rideRequests[0].expiresIn || 300,
                }}
                onAccept={(id) => {
                  toast.success('Course acceptée !');
                  // Here we would call acceptRide or similar
                }}
                onDecline={(id) => {
                  toast.info('Course ignorée');
                }}
              />
            </div>
          )}

          {/* Course active */}
          {activeRide && (
            <div className="p-4">
              <ActiveRideCard
                ride={activeRide}
                onUpdateStatus={updateRideStatus}
              />
            </div>
          )}

          {/* Dashboard normal */}
          {!activeRide && !pendingRide && (
            <Tabs defaultValue="overview" className="flex-1">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                <TabsTrigger
                  value="overview"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  Aperçu
                </TabsTrigger>
                <TabsTrigger
                  value="ai"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  <Brain className="w-4 h-4 mr-1" />
                  IA
                </TabsTrigger>
                <TabsTrigger
                  value="earnings"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  Gains
                </TabsTrigger>
                <TabsTrigger
                  value="stats"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  Stats
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="p-4 space-y-4 mt-0">
                {/* Carte hotspots temps réel avec IA */}
                {isOnline && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-500" />
                      Hotspots en temps réel
                    </h3>
                    <SmartHotspotMap height="200px" />
                  </div>
                )}

                {/* Carte affectation flotte */}
                {operatingMode === 'fleet_assigned' && hasFleetAssignment && assignment && (
                  <FleetAssignmentCard
                    assignment={{
                      id: assignment.assignmentId,
                      fleet_vehicle_id: assignment.vehicleId,
                      driver_id: user?.id || '',
                      assignment_type: 'permanent',
                      shift_type: assignment.shiftType as any,
                      start_date: assignment.startDate,
                      daily_target: assignment.dailyTarget || undefined,
                      commission_rate: assignment.commissionRate,
                      is_active: assignment.isActive,
                      created_at: assignment.startDate,
                      updated_at: assignment.startDate,
                    }}
                    vehiclePlate={assignment.vehiclePlate}
                    ownerName={assignment.ownerName}
                    ownerPhone={assignment.ownerPhone || undefined}
                  />
                )}

                {/* Score de fiabilité */}
                {reliabilityScore && (
                  <ReliabilityScoreCard score={reliabilityScore} />
                )}

                {/* Actions rapides */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col"
                    onClick={() => navigate('/driver/planning')}
                  >
                    <Clock className="w-6 h-6 mb-2 text-primary" />
                    <span>Mes horaires</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col"
                    onClick={() => navigate('/history')}
                  >
                    <Users className="w-6 h-6 mb-2 text-primary" />
                    <span>Historique</span>
                  </Button>
                </div>

                {/* Message hors ligne */}
                {!isOnline && (
                  <div className="text-center py-8">
                    <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground">
                      Passez en ligne pour recevoir des courses
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ai" className="p-4 space-y-4 mt-0">
                {/* Panel IA complet */}
                <AITrafficPanel 
                  onZoneClick={(lat, lng) => {
                    toast.info(`Zone sélectionnée`, {
                      description: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
                    });
                  }}
                />

                {/* Zone de travail demain */}
                <DriverWorkZoneSelector
                  zones={zones}
                  currentIntention={driverIntention}
                  predictions={predictions}
                  onSave={setDriverWorkZone}
                />

                {/* Météo des courses */}
                <DemandHeatmap
                  zones={zones}
                  predictions={predictions}
                  selectedHour={selectedHour}
                  onHourChange={(hour) => {
                    setSelectedHour(hour);
                    fetchPredictions(undefined, hour);
                  }}
                />
              </TabsContent>

              <TabsContent value="earnings" className="p-4 space-y-4 mt-0">
                {/* Bouton ajout dépense */}
                <div className="flex justify-end">
                  <QuickExpenseButton
                    fleetVehicleId={driverProfile?.fleetVehicleId}
                  />
                </div>

                {/* Carte des gains */}
                <DailyEarningsCard
                  summary={dailySummary}
                  operatingMode={operatingMode}
                  commissionRate={assignment?.commissionRate}
                />

                {/* Lien vers rapports */}
                <Button
                  variant="ghost"
                  className="w-full justify-between"
                  onClick={() => navigate('/driver/reports')}
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Voir tous les rapports
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </TabsContent>

              <TabsContent value="stats" className="p-4 space-y-4 mt-0">
                <DriverStatsGrid stats={stats} />

                {/* Graphique tendance */}
                <Button
                  variant="ghost"
                  className="w-full justify-between"
                  onClick={() => navigate('/driver/analytics')}
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Voir les statistiques détaillées
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </TabsContent>
            </Tabs>
          )}
        </div>

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
            onClick={() => setShowModeSelector(true)}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default DriverDashboardV2;

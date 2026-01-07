import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useDriverMode } from '@/hooks/useDriverMode';
import { useDriverServices } from '@/hooks/useDriverServices';
import { ClassicDriverControls, SeatBookingAlert, SeatCapacityWidget } from '@/components/driver/classic';
import { ServiceTypeSelector } from '@/components/driver/ServiceTypeSelector';
import { 
  ArrowLeft, 
  Bell, 
  Settings,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DriverClassicDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOnline, toggleOnline, stats } = useDriverMode();
  const {
    activeService,
    activeServiceConfig,
    authorizedServices,
    currentDestination,
    seats,
    seatStats,
    activeBookingAlert,
    setActiveService,
    setDestination,
    clearDestination,
    updateSeatStatus,
    simulateIncomingBooking,
    acknowledgeBooking,
    dismissBooking,
    canUpgradeTo,
  } = useDriverServices();

  const [showServiceSelector, setShowServiceSelector] = useState(false);

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'C';

  // Simuler une réservation (pour la démo)
  const handleSimulateBooking = () => {
    if (seatStats.empty === 0) {
      toast.error('Aucune place disponible');
      return;
    }
    simulateIncomingBooking();
  };

  return (
    <MobileLayout showNav={false} showThemeToggle={false}>
      {/* Alerte de réservation plein écran */}
      {activeBookingAlert && (
        <SeatBookingAlert
          notification={activeBookingAlert}
          onAcknowledge={acknowledgeBooking}
          onDismiss={dismissBooking}
        />
      )}

      <div className="flex flex-col h-full bg-background">
        {/* Header simplifié */}
        <div className={cn(
          'px-4 py-3 border-b transition-colors',
          isOnline ? 'bg-green-500/10' : 'bg-background'
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Avatar className="w-10 h-10 border-2 border-yellow-500">
                <AvatarFallback className="bg-yellow-100 text-yellow-700 font-bold">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">Mode Taxi</p>
                  <Badge 
                    variant="secondary" 
                    className={cn('text-xs', activeServiceConfig.bgColor, 'text-white')}
                  >
                    {activeServiceConfig.shortLabel}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.todayTrips} courses • {stats.todayEarnings.toLocaleString()} FCFA
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full relative"
              >
                <Bell className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowServiceSelector(true)}
                className="rounded-full"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Widget compteur compact en haut */}
          {isOnline && (
            <div className="mt-3 flex justify-center">
              <SeatCapacityWidget seats={seats} compact />
            </div>
          )}
        </div>

        {/* Contenu principal */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Contrôles taxi classique */}
          <ClassicDriverControls
            isOnline={isOnline}
            onToggleOnline={toggleOnline}
            currentDestination={currentDestination?.zoneId}
            onSelectDestination={setDestination}
            onClearDestination={clearDestination}
            seats={seats}
            onSeatStatusChange={updateSeatStatus}
          />

          {/* Suggestion upgrade */}
          {activeService === 'taxi_classic' && canUpgradeTo('confort_partage') && isOnline && (
            <div 
              onClick={() => setActiveService('confort_partage')}
              className="p-4 bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-2xl border border-purple-500/30 cursor-pointer hover:border-purple-500/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-purple-700 dark:text-purple-300">
                    Passez en Confort Partagé
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Gagnez plus avec les courses climatisées
                  </p>
                </div>
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          )}

          {/* Bouton de démo */}
          {isOnline && seatStats.empty > 0 && (
            <Button
              variant="outline"
              onClick={handleSimulateBooking}
              className="w-full"
            >
              <Bell className="w-4 h-4 mr-2" />
              Simuler une réservation
            </Button>
          )}

          {/* Sélecteur de service (modal) */}
          {showServiceSelector && (
            <div 
              className="fixed inset-0 bg-black/50 z-50 flex items-end"
              onClick={() => setShowServiceSelector(false)}
            >
              <div 
                className="bg-background w-full rounded-t-3xl p-6 animate-slide-in-right"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold mb-4">Changer de mode</h3>
                <ServiceTypeSelector
                  activeService={activeService}
                  authorizedServices={authorizedServices}
                  onSelectService={(service) => {
                    setActiveService(service);
                    setShowServiceSelector(false);
                    if (service === 'taxi_classic') {
                      // Rester ici
                    } else {
                      navigate('/driver');
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  className="w-full mt-4"
                  onClick={() => setShowServiceSelector(false)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate('/')}
            >
              Mode passager
            </Button>
            <Button 
              variant="default" 
              className="flex-1"
              onClick={() => navigate('/driver')}
            >
              Dashboard complet
            </Button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default DriverClassicDashboard;

import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { useDriverMode } from "@/hooks/useDriverMode";
import { useAuth } from "@/hooks/useAuth";
import {
  DriverHeader,
  DriverStatsGrid,
  RideRequestCard,
  ActiveRideCard,
  ReliabilityScoreCard,
  InterfaceLevelSelector,
} from "@/components/driver";
import { Car, Clock, Users, Settings2 } from "lucide-react";
import { useState } from "react";

const DriverDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showInterfaceSelector, setShowInterfaceSelector] = useState(false);
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

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'C';

  return (
    <MobileLayout showNav={false} showThemeToggle={false}>
      <div className="flex flex-col h-full bg-background">
        {/* Header with online toggle */}
        <DriverHeader
          userInitial={userInitial}
          stats={stats}
          reliabilityScore={reliabilityScore}
          isOnline={isOnline}
          onToggleOnline={toggleOnline}
        />

        {/* Interface Level Selector - Compact */}
        <div className="px-4 py-2 border-b flex items-center justify-between">
          <InterfaceLevelSelector compact />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowInterfaceSelector(!showInterfaceSelector)}
          >
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Expanded Interface Selector */}
        {showInterfaceSelector && (
          <div className="px-4 py-3 border-b bg-muted/30">
            <InterfaceLevelSelector onSelect={() => setShowInterfaceSelector(false)} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Pending ride request */}
          {pendingRide && (
            <RideRequestCard
              ride={pendingRide}
              countdown={acceptCountdown}
              onAccept={acceptRide}
              onDecline={declineRide}
            />
          )}

          {/* Active ride */}
          {activeRide && (
            <ActiveRideCard
              ride={activeRide}
              onUpdateStatus={updateRideStatus}
            />
          )}

          {/* Stats and actions when idle */}
          {!activeRide && !pendingRide && (
            <>
              {/* Reliability Score */}
              {reliabilityScore && (
                <ReliabilityScoreCard score={reliabilityScore} />
              )}

              {/* Today's summary */}
              <DriverStatsGrid stats={stats} />

              {/* Quick actions */}
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

              {/* Offline message */}
              {!isOnline && (
                <div className="text-center py-8">
                  <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Passez en ligne pour recevoir des courses</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom nav for driver */}
        <div className="p-4 border-t bg-background">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/')}
          >
            Retour mode passager
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default DriverDashboard;

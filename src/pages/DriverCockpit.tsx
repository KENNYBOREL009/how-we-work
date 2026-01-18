import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDriverMode } from '@/hooks/useDriverMode';
import { DriverCockpit } from '@/components/driver';
import { toast } from 'sonner';

const DriverCockpitPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOnline, toggleOnline, stats, reliabilityScore } = useDriverMode();
  const [isTaxiCollectifMode, setIsTaxiCollectifMode] = useState(true);

  const driverName = user?.email?.split('@')[0] || 'Chauffeur';

  const handleAcceptRide = (requestId: string) => {
    console.log('Ride accepted:', requestId);
  };

  const handleDeclineRide = (requestId: string) => {
    console.log('Ride declined:', requestId);
  };

  const handleUpdateTripStatus = () => {
    console.log('Trip status updated');
  };

  const handleCallClient = () => {
    toast.info('Appel du client...');
  };

  const handleChatClient = () => {
    toast.info('Ouverture du chat...');
  };

  const handleEndDay = () => {
    if (isOnline) toggleOnline();
    toast.success('Journée terminée !');
    navigate('/');
  };

  return (
    <DriverCockpit
      driverName={driverName}
      stats={{
        todayTrips: stats.todayTrips,
        todayEarnings: stats.todayEarnings,
        rating: stats.rating,
        hoursWorked: 6,
        acceptanceRate: stats.acceptanceRate,
        reliabilityScore: reliabilityScore?.reliability_score || 95,
      }}
      isOnline={isOnline}
      isTaxiCollectifMode={isTaxiCollectifMode}
      currentDestination="Bonanjo"
      onToggleOnline={toggleOnline}
      onAcceptRide={handleAcceptRide}
      onDeclineRide={handleDeclineRide}
      onUpdateTripStatus={handleUpdateTripStatus}
      onCallClient={handleCallClient}
      onChatClient={handleChatClient}
      onEndDay={handleEndDay}
    />
  );
};

export default DriverCockpitPage;

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { ActiveTripView } from "@/components/trip/ActiveTripView";
import { RateDriverDialog } from "@/components/trip/RateDriverDialog";
import { PaymentConfirmDialog } from "@/components/trip/PaymentConfirmDialog";
import { useActiveTrip } from "@/hooks/useActiveTrip";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { vehicleClasses, extraServices } from "@/components/signal/PrivateRideOptions";

interface TripStateData {
  origin?: string;
  destination?: string;
  fare?: number;
  tripType?: string;
  isPrivate?: boolean;
  vehicleClass?: string | null;
  selectedServices?: string[];
}

const ActiveTrip = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { activeTrip, coPassengers, loading, confirmPayment, rateDriver, cancelTrip } = useActiveTrip();
  const { wallet } = useWallet();
  
  // Get trip data from navigation state (for demo mode or fresh booking)
  const tripState = location.state as TripStateData | null;

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [tripCompleted, setTripCompleted] = useState(false);
  
  // Derive trip info from either active trip or navigation state
  const isPrivate = tripState?.isPrivate || activeTrip?.trip_type === 'privatisation';
  const tripOrigin = activeTrip?.origin || tripState?.origin || 'Ma position';
  const tripDestination = activeTrip?.destination || tripState?.destination || 'Destination';
  const tripFare = activeTrip?.fare || tripState?.fare || 0;
  const tripType = activeTrip?.trip_type || tripState?.tripType || 'taxi';

  // Get selected vehicle class info for private rides
  const selectedVehicleClass = tripState?.vehicleClass 
    ? vehicleClasses.find(v => v.id === tripState.vehicleClass) 
    : null;
  const selectedServicesList = tripState?.selectedServices?.map(
    serviceId => extraServices.find(s => s.id === serviceId)
  ).filter(Boolean) || [];

  // Handler called when trip completes via ActiveTripView
  const handleTripComplete = () => {
    if (!tripCompleted) {
      setTripCompleted(true);
      setShowPaymentDialog(true);
    }
  };

  const handlePaymentConfirm = async (paymentMethod: 'wallet' | 'cash') => {
    // For demo mode without real trip
    if (!activeTrip && tripState) {
      setShowPaymentDialog(false);
      setShowRatingDialog(true);
      return true;
    }
    
    if (!activeTrip) return false;
    
    // Only deduct from wallet if paying with wallet
    if (paymentMethod === 'wallet') {
      const success = await confirmPayment(activeTrip.id, activeTrip.fare || 0);
      if (success) {
        setShowPaymentDialog(false);
        setShowRatingDialog(true);
      }
      return success;
    } else {
      // Cash payment - just mark as confirmed without wallet deduction
      setShowPaymentDialog(false);
      setShowRatingDialog(true);
      return true;
    }
  };

  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!activeTrip?.vehicle_id) return;
    await rateDriver(
      activeTrip.id,
      activeTrip.vehicle_id,
      rating,
      comment
    );
    navigate('/');
  };

  const handleCancel = async () => {
    if (!activeTrip) return;
    const confirmed = window.confirm('Êtes-vous sûr de vouloir annuler cette course ?');
    if (confirmed) {
      await cancelTrip(activeTrip.id);
      navigate('/');
    }
  };

  const handleEmergency = () => {
    toast.error("🚨 Alerte envoyée", {
      description: "Notre équipe de sécurité a été notifiée. Restez calme.",
      duration: 5000,
    });
    // Ici on pourrait envoyer une notification aux contacts d'urgence
  };

  if (loading) {
    return (
      <MobileLayout showNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  // Show empty state only if no active trip AND no trip state from navigation
  if (!activeTrip && !tripState) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <MapPin className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold mb-2">Aucune course en cours</h1>
          <p className="text-muted-foreground mb-6">
            Lancez un signal pour commander une course
          </p>
          <Button onClick={() => navigate('/signal')} className="rounded-xl">
            Lancer un Signal
          </Button>
        </div>
      </MobileLayout>
    );
  }

  // Créer un véhicule mock pour l'affichage
  const vehicleStatus: 'available' | 'full' | 'private' | 'offline' = isPrivate ? 'private' : 'available';
  const mockVehicle = {
    id: activeTrip?.vehicle_id || '',
    vehicle_type: 'taxi' as const,
    plate_number: isPrivate ? 'VIP 888 CM' : 'CE 1234 LT',
    capacity: 4,
    destination: tripDestination,
    status: vehicleStatus,
    operator: isPrivate ? (selectedVehicleClass?.name || 'Premium') : 'LOKEBO',
  };

  const passengers = coPassengers.map(p => ({
    id: p.id,
    first_name: p.first_name || 'Passager',
    avatar_url: p.avatar_url,
    pickup_location: p.pickup_location || '',
    dropoff_location: p.dropoff_location || '',
  }));

  const isSharedRide = activeTrip?.is_shared_ride || tripType === 'confort-partage';

  return (
    <MobileLayout showNav={false}>
      <ActiveTripView
        vehicle={mockVehicle}
        destination={tripDestination}
        origin={tripOrigin}
        fare={tripFare}
        isSharedRide={isSharedRide}
        isPrivate={isPrivate}
        vehicleClassName={selectedVehicleClass?.name}
        selectedServices={selectedServicesList.map(s => s?.name || '')}
        passengers={passengers}
        onCancel={handleCancel}
        onEmergency={handleEmergency}
        onTripComplete={handleTripComplete}
      />

      {/* Payment Confirmation Dialog */}
      <PaymentConfirmDialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        onConfirm={handlePaymentConfirm}
        amount={tripFare}
        walletBalance={wallet?.balance || 0}
        tripType={isPrivate ? 'privatisation' : (isSharedRide ? 'confort-partage' : 'taxi')}
        destination={tripDestination}
        isPrivate={isPrivate}
        vehicleClassName={selectedVehicleClass?.name}
      />

      {/* Rating Dialog */}
      <RateDriverDialog
        open={showRatingDialog}
        onClose={() => {
          setShowRatingDialog(false);
          navigate('/');
        }}
        onSubmit={handleRatingSubmit}
        driverName={isPrivate ? "Chauffeur VIP" : ""}
        plateNumber={mockVehicle.plate_number}
      />
    </MobileLayout>
  );
};

export default ActiveTrip;

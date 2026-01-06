import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

const ActiveTrip = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeTrip, coPassengers, loading, confirmPayment, rateDriver, cancelTrip } = useActiveTrip();
  const { wallet } = useWallet();

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [tripCompleted, setTripCompleted] = useState(false);

  // Simuler la fin de course pour demo
  useEffect(() => {
    if (activeTrip?.current_status === 'in_progress') {
      const timer = setTimeout(() => {
        setTripCompleted(true);
        setShowPaymentDialog(true);
      }, 30000); // 30 secondes pour demo
      
      return () => clearTimeout(timer);
    }
  }, [activeTrip?.current_status]);

  const handlePaymentConfirm = async () => {
    if (!activeTrip) return false;
    const success = await confirmPayment(activeTrip.id, activeTrip.fare || 0);
    if (success) {
      setShowPaymentDialog(false);
      setShowRatingDialog(true);
    }
    return success;
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

  if (!activeTrip) {
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
  const mockVehicle = {
    id: activeTrip.vehicle_id || '',
    vehicle_type: 'taxi' as const,
    plate_number: 'CE 1234 LT',
    capacity: 4,
    destination: activeTrip.destination || null,
    status: 'available' as const,
    operator: 'LOKEBO',
  };

  const passengers = coPassengers.map(p => ({
    id: p.id,
    first_name: p.first_name || 'Passager',
    avatar_url: p.avatar_url,
    pickup_location: p.pickup_location || '',
    dropoff_location: p.dropoff_location || '',
  }));

  return (
    <MobileLayout showNav={false}>
      <ActiveTripView
        vehicle={mockVehicle}
        destination={activeTrip.destination || 'Destination'}
        origin={activeTrip.origin || 'Ma position'}
        fare={activeTrip.fare || 0}
        isSharedRide={activeTrip.is_shared_ride}
        passengers={passengers}
        onCancel={handleCancel}
        onEmergency={handleEmergency}
      />

      {/* Payment Confirmation Dialog */}
      <PaymentConfirmDialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        onConfirm={handlePaymentConfirm}
        amount={activeTrip.fare || 0}
        walletBalance={wallet?.balance || 0}
        tripType={activeTrip.is_shared_ride ? 'confort-partage' : 'taxi'}
        destination={activeTrip.destination || ''}
      />

      {/* Rating Dialog */}
      <RateDriverDialog
        open={showRatingDialog}
        onClose={() => {
          setShowRatingDialog(false);
          navigate('/');
        }}
        onSubmit={handleRatingSubmit}
        driverName=""
        plateNumber={mockVehicle.plate_number}
      />
    </MobileLayout>
  );
};

export default ActiveTrip;

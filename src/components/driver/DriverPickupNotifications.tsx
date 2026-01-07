import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PickupNotificationCard from './PickupNotificationCard';
import { toast } from 'sonner';

interface PickupRequest {
  id: string;
  clientName: string;
  clientAvatar?: string;
  pickupDistance: number;
  seatPreference: 'front' | 'back-window' | 'back-middle' | null;
  detourTime: number;
  pickupLocation: string;
  isOnRoute: boolean;
  pickupLat?: number;
  pickupLng?: number;
}

interface DriverPickupNotificationsProps {
  onNavigateToPickup?: (request: PickupRequest) => void;
}

const DriverPickupNotifications: React.FC<DriverPickupNotificationsProps> = ({ 
  onNavigateToPickup 
}) => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<PickupRequest[]>([]);

  // Simuler des demandes entrantes (pour la démo)
  useEffect(() => {
    // Simule une demande après 3 secondes
    const timer = setTimeout(() => {
      const mockRequest: PickupRequest = {
        id: 'req-1',
        clientName: 'Paul Mbarga',
        pickupDistance: 200,
        seatPreference: 'front',
        detourTime: 2,
        pickupLocation: 'Carrefour Ange Raphael',
        isOnRoute: true,
        pickupLat: 4.0511,
        pickupLng: 9.7679,
      };
      setRequests([mockRequest]);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleAccept = useCallback((requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (request) {
      toast.success(`Demande acceptée !`, {
        description: `Navigation vers ${request.clientName} - ${request.pickupLocation}`,
      });
      
      // Déclencher la navigation GPS
      if (onNavigateToPickup) {
        onNavigateToPickup(request);
      }
      
      setRequests(prev => prev.filter(r => r.id !== requestId));
    }
  }, [requests, onNavigateToPickup]);

  const handleReject = useCallback((requestId: string) => {
    toast.info('Demande refusée');
    setRequests(prev => prev.filter(r => r.id !== requestId));
  }, []);

  if (requests.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto space-y-3">
      {requests.map((request) => (
        <PickupNotificationCard
          key={request.id}
          request={request}
          onAccept={() => handleAccept(request.id)}
          onReject={() => handleReject(request.id)}
        />
      ))}
    </div>
  );
};

export default DriverPickupNotifications;

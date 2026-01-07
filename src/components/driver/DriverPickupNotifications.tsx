import React, { useState, useEffect } from 'react';
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
}

const DriverPickupNotifications: React.FC = () => {
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
      };
      setRequests([mockRequest]);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleAccept = (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (request) {
      toast.success(`Demande acceptée !`, {
        description: `Ramassage de ${request.clientName} dans ${request.pickupDistance}m`,
      });
      setRequests(prev => prev.filter(r => r.id !== requestId));
    }
  };

  const handleReject = (requestId: string) => {
    toast.info('Demande refusée');
    setRequests(prev => prev.filter(r => r.id !== requestId));
  };

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

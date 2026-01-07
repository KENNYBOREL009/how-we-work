import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import type { 
  DriverServiceType, 
  DriverHybridProfile,
  SeatBookingNotification 
} from '@/types/driver-services';
import { DRIVER_SERVICE_CONFIGS } from '@/types/driver-services';

interface SeatStatus {
  id: number;
  status: 'empty' | 'occupied' | 'reserved';
  clientName?: string;
}

export const useDriverServices = () => {
  const { user } = useAuth();
  
  // État du profil hybride
  const [hybridProfile, setHybridProfile] = useState<DriverHybridProfile>({
    activeService: 'taxi_classic',
    authorizedServices: ['taxi_classic', 'confort_partage'], // Simulé - viendrait de la DB
    currentDestination: undefined,
    availableSeats: 4,
    maxSeats: 4,
    recentDestinations: [],
  });

  // État des sièges (pour taxi classique)
  const [seats, setSeats] = useState<SeatStatus[]>([
    { id: 1, status: 'empty' },
    { id: 2, status: 'empty' },
    { id: 3, status: 'empty' },
    { id: 4, status: 'empty' },
  ]);

  // Notifications de réservation en attente
  const [pendingBookings, setPendingBookings] = useState<SeatBookingNotification[]>([]);
  const [activeBookingAlert, setActiveBookingAlert] = useState<SeatBookingNotification | null>(null);

  // Changer de service actif
  const setActiveService = useCallback((service: DriverServiceType) => {
    if (hybridProfile.authorizedServices.includes(service)) {
      setHybridProfile(prev => ({ ...prev, activeService: service }));
    }
  }, [hybridProfile.authorizedServices]);

  // Définir la destination (taxi classique)
  const setDestination = useCallback((zoneId: string, zoneName: string) => {
    setHybridProfile(prev => ({
      ...prev,
      currentDestination: { zoneId, zoneName },
      recentDestinations: [
        { zoneId, zoneName, usedAt: new Date().toISOString() },
        ...prev.recentDestinations.filter(d => d.zoneId !== zoneId).slice(0, 4),
      ],
    }));
  }, []);

  // Effacer la destination
  const clearDestination = useCallback(() => {
    setHybridProfile(prev => ({
      ...prev,
      currentDestination: undefined,
    }));
  }, []);

  // Mettre à jour le statut d'un siège
  const updateSeatStatus = useCallback((seatId: number, status: 'empty' | 'occupied') => {
    setSeats(prev => prev.map(seat => 
      seat.id === seatId ? { ...seat, status } : seat
    ));
  }, []);

  // Simuler une réservation entrante (pour demo)
  const simulateIncomingBooking = useCallback(() => {
    const booking: SeatBookingNotification = {
      id: `booking-${Date.now()}`,
      clientName: 'Jean M.',
      seatType: 'back',
      pickupDistance: 300,
      isOnRoute: true,
      fare: 150,
      createdAt: new Date().toISOString(),
    };
    setActiveBookingAlert(booking);
  }, []);

  // Acquitter une notification de réservation
  const acknowledgeBooking = useCallback(() => {
    if (activeBookingAlert) {
      // Marquer un siège comme réservé
      const emptySeat = seats.find(s => s.status === 'empty');
      if (emptySeat) {
        setSeats(prev => prev.map(seat => 
          seat.id === emptySeat.id 
            ? { ...seat, status: 'reserved', clientName: activeBookingAlert.clientName }
            : seat
        ));
      }
      setActiveBookingAlert(null);
    }
  }, [activeBookingAlert, seats]);

  // Rejeter une réservation
  const dismissBooking = useCallback(() => {
    setActiveBookingAlert(null);
    // En prod: notifier le backend que le chauffeur a refusé
  }, []);

  // Obtenir la config du service actif
  const getActiveServiceConfig = useCallback(() => {
    return DRIVER_SERVICE_CONFIGS[hybridProfile.activeService];
  }, [hybridProfile.activeService]);

  // Vérifier si on peut upgrader vers un service
  const canUpgradeTo = useCallback((service: DriverServiceType): boolean => {
    return hybridProfile.authorizedServices.includes(service);
  }, [hybridProfile.authorizedServices]);

  // Calculer les stats des sièges
  const seatStats = {
    empty: seats.filter(s => s.status === 'empty').length,
    occupied: seats.filter(s => s.status === 'occupied').length,
    reserved: seats.filter(s => s.status === 'reserved').length,
    total: seats.length,
  };

  return {
    hybridProfile,
    activeService: hybridProfile.activeService,
    activeServiceConfig: getActiveServiceConfig(),
    authorizedServices: hybridProfile.authorizedServices,
    currentDestination: hybridProfile.currentDestination,
    seats,
    seatStats,
    activeBookingAlert,
    
    // Actions
    setActiveService,
    setDestination,
    clearDestination,
    updateSeatStatus,
    simulateIncomingBooking,
    acknowledgeBooking,
    dismissBooking,
    canUpgradeTo,
  };
};

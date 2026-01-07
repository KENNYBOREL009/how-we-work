import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { useDriverReliability } from './useDriverReliability';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { DriverStats, PendingRide, ActiveDriverRide, DriverReliabilityScore } from '@/types';

// =============================================
// CONTEXT TYPES
// =============================================

interface DriverModeContextType {
  // Mode state
  isDriverMode: boolean;
  isOnline: boolean;
  
  // Ride state
  pendingRide: PendingRide | null;
  activeRide: ActiveDriverRide | null;
  acceptCountdown: number;
  
  // Stats
  stats: DriverStats;
  reliabilityScore: DriverReliabilityScore | null;
  
  // Loading states
  loading: boolean;
  
  // Actions
  toggleDriverMode: () => void;
  toggleOnline: () => void;
  acceptRide: () => void;
  declineRide: () => void;
  updateRideStatus: () => void;
  refreshStats: () => Promise<void>;
}

// =============================================
// DEFAULT VALUES
// =============================================

const DEFAULT_STATS: DriverStats = {
  todayEarnings: 0,
  todayTrips: 0,
  weekEarnings: 0,
  rating: 4.8,
  acceptanceRate: 100,
};

const DriverModeContext = createContext<DriverModeContextType | null>(null);

// =============================================
// PROVIDER
// =============================================

interface DriverModeProviderProps {
  children: ReactNode;
}

export const DriverModeProvider = ({ children }: DriverModeProviderProps) => {
  const { user } = useAuth();
  const { getReliabilityScore, getSuspensionStatus } = useDriverReliability();
  
  // Mode state
  const [isDriverMode, setIsDriverMode] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  
  // Ride state
  const [pendingRide, setPendingRide] = useState<PendingRide | null>(null);
  const [activeRide, setActiveRide] = useState<ActiveDriverRide | null>(null);
  const [acceptCountdown, setAcceptCountdown] = useState(30);
  
  // Stats
  const [stats, setStats] = useState<DriverStats>(DEFAULT_STATS);
  const [reliabilityScore, setReliabilityScore] = useState<DriverReliabilityScore | null>(null);
  
  // Loading
  const [loading, setLoading] = useState(false);

  // =============================================
  // FETCH STATS
  // =============================================

  const refreshStats = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch reliability score
      const score = await getReliabilityScore();
      if (score) {
        setReliabilityScore(score as unknown as DriverReliabilityScore);
      }
      
      // TODO: Fetch actual stats from database
      // For now, use demo stats
      setStats({
        todayEarnings: 25500,
        todayTrips: 8,
        weekEarnings: 142000,
        rating: 4.8,
        acceptanceRate: score?.acceptanceRate || 92,
      });
    } catch (error) {
      console.error('Error fetching driver stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user, getReliabilityScore]);

  // =============================================
  // MODE TOGGLE
  // =============================================

  const toggleDriverMode = useCallback(() => {
    setIsDriverMode(prev => !prev);
    if (isDriverMode) {
      setIsOnline(false);
      setPendingRide(null);
      setActiveRide(null);
    }
  }, [isDriverMode]);

  const toggleOnline = useCallback(async () => {
    if (!user) return;
    
    // Check if suspended
    const suspensionStatus = await getSuspensionStatus();
    if (suspensionStatus?.isSuspended) {
      toast.error('Compte suspendu', {
        description: suspensionStatus.reason || 'Vous ne pouvez pas passer en ligne',
      });
      return;
    }
    
    const newOnlineStatus = !isOnline;
    setIsOnline(newOnlineStatus);
    toast.success(newOnlineStatus ? "Vous êtes maintenant en ligne" : "Vous êtes maintenant hors ligne");
  }, [user, isOnline, getSuspensionStatus]);

  // =============================================
  // RIDE ACTIONS
  // =============================================

  const acceptRide = useCallback(() => {
    if (!pendingRide) return;
    
    setActiveRide({
      id: pendingRide.id,
      clientName: pendingRide.clientName,
      clientPhone: '+237 6XX XXX XXX',
      origin: pendingRide.origin,
      destination: pendingRide.destination,
      fare: pendingRide.fare,
      status: 'going_to_pickup',
      eta: 5,
    });
    setPendingRide(null);
    toast.success("Course acceptée !");
  }, [pendingRide]);

  const declineRide = useCallback(() => {
    setPendingRide(null);
    toast.info("Course refusée");
  }, []);

  const updateRideStatus = useCallback(() => {
    if (!activeRide) return;

    if (activeRide.status === 'going_to_pickup') {
      setActiveRide({ ...activeRide, status: 'waiting', eta: 0 });
      toast.success("Vous êtes arrivé au point de départ");
    } else if (activeRide.status === 'waiting') {
      setActiveRide({ ...activeRide, status: 'in_progress', eta: 12 });
      toast.success("Course démarrée");
    } else {
      toast.success("Course terminée - Paiement reçu !");
      setActiveRide(null);
      // Refresh stats after completing a ride
      refreshStats();
    }
  }, [activeRide, refreshStats]);

  // =============================================
  // SIMULATE INCOMING RIDES
  // =============================================

  useEffect(() => {
    if (!isOnline || activeRide || !isDriverMode) return;

    const timeout = setTimeout(() => {
      setPendingRide({
        id: `ride-${Date.now()}`,
        clientName: 'Marie N.',
        origin: 'Akwa, Douala',
        destination: 'Bonanjo, Douala',
        distance: '4.2 km',
        fare: 2500,
        isShared: false,
        passengerCount: 1,
        expiresIn: 30,
      });
      setAcceptCountdown(30);
      toast.info("🚗 Nouvelle course disponible !");
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isOnline, activeRide, isDriverMode]);

  // =============================================
  // COUNTDOWN TIMER
  // =============================================

  useEffect(() => {
    if (!pendingRide) return;

    const interval = setInterval(() => {
      setAcceptCountdown(prev => {
        if (prev <= 1) {
          setPendingRide(null);
          toast.error("Course expirée");
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingRide]);

  // =============================================
  // INITIAL LOAD
  // =============================================

  useEffect(() => {
    if (user && isDriverMode) {
      refreshStats();
    }
  }, [user, isDriverMode, refreshStats]);

  // =============================================
  // CONTEXT VALUE
  // =============================================

  const value: DriverModeContextType = {
    isDriverMode,
    isOnline,
    pendingRide,
    activeRide,
    acceptCountdown,
    stats,
    reliabilityScore,
    loading,
    toggleDriverMode,
    toggleOnline,
    acceptRide,
    declineRide,
    updateRideStatus,
    refreshStats,
  };

  return (
    <DriverModeContext.Provider value={value}>
      {children}
    </DriverModeContext.Provider>
  );
};

// =============================================
// HOOK
// =============================================

export const useDriverMode = (): DriverModeContextType => {
  const context = useContext(DriverModeContext);
  if (!context) {
    throw new Error('useDriverMode must be used within a DriverModeProvider');
  }
  return context;
};

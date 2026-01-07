import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { DriverStats, PendingRide } from '@/types';

interface RideRequest {
  id: string;
  type: 'signal' | 'scheduled';
  clientName: string;
  clientId?: string;
  origin: string;
  destination: string;
  latitude: number;
  longitude: number;
  distance: string;
  fare: number;
  isShared: boolean;
  passengerCount: number;
  expiresIn: number;
  scheduledAt?: string;
}

export const useDriverRealStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DriverStats>({
    todayEarnings: 0,
    todayTrips: 0,
    weekEarnings: 0,
    rating: 0,
    acceptanceRate: 100,
  });
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTodayStats = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      const weekAgoISO = weekAgo.toISOString();

      // Fetch today's completed trips
      const { data: todayTrips, error: todayError } = await supabase
        .from('trips')
        .select('fare, created_at')
        .eq('vehicle_id', user.id) // Assuming driver is linked via vehicle or trip
        .gte('created_at', todayISO)
        .eq('status', 'completed');

      // Fetch week's trips for weekly earnings
      const { data: weekTrips, error: weekError } = await supabase
        .from('trips')
        .select('fare')
        .eq('vehicle_id', user.id)
        .gte('created_at', weekAgoISO)
        .eq('status', 'completed');

      // Fetch driver's average rating
      const { data: ratingData, error: ratingError } = await supabase
        .rpc('get_driver_avg_rating', { p_driver_id: user.id });

      // Fetch reliability score for acceptance rate
      const { data: reliabilityData, error: relError } = await supabase
        .from('driver_reliability_scores')
        .select('acceptance_rate')
        .eq('driver_id', user.id)
        .single();

      const todayEarnings = (todayTrips || []).reduce((sum, t) => sum + (t.fare || 0), 0);
      const weekEarnings = (weekTrips || []).reduce((sum, t) => sum + (t.fare || 0), 0);

      setStats({
        todayEarnings,
        todayTrips: (todayTrips || []).length,
        weekEarnings,
        rating: ratingData || 4.8,
        acceptanceRate: reliabilityData?.acceptance_rate || 100,
      });
    } catch (error) {
      console.error('Error fetching driver stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchRideRequests = useCallback(async () => {
    if (!user) return;

    try {
      const now = new Date().toISOString();

      // Fetch active client signals (as potential ride requests)
      const { data: signals, error: signalsError } = await supabase
        .from('client_signals')
        .select('*')
        .gt('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch pending scheduled trips for this driver
      const { data: scheduled, error: scheduledError } = await supabase
        .from('scheduled_trips')
        .select('*')
        .eq('driver_id', user.id)
        .eq('status', 'matched')
        .order('scheduled_at', { ascending: true })
        .limit(5);

      const signalRequests: RideRequest[] = (signals || []).map((s, idx) => ({
        id: s.id,
        type: 'signal' as const,
        clientName: `Client ${idx + 1}`,
        clientId: s.user_id,
        origin: `Zone Akwa (${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)})`,
        destination: 'À confirmer',
        latitude: s.latitude,
        longitude: s.longitude,
        distance: `~${(Math.random() * 3 + 0.5).toFixed(1)} km`,
        fare: s.people_count * 500, // Estimate
        isShared: s.people_count > 1,
        passengerCount: s.people_count,
        expiresIn: Math.max(0, Math.floor((new Date(s.expires_at).getTime() - Date.now()) / 1000)),
      }));

      const scheduledRequests: RideRequest[] = (scheduled || []).map((s) => ({
        id: s.id,
        type: 'scheduled' as const,
        clientName: 'Réservation',
        clientId: s.client_id,
        origin: s.origin,
        destination: s.destination,
        latitude: 0,
        longitude: 0,
        distance: '~5 km',
        fare: s.estimated_fare,
        isShared: false,
        passengerCount: 1,
        expiresIn: 300,
        scheduledAt: s.scheduled_at,
      }));

      setRideRequests([...scheduledRequests, ...signalRequests]);
    } catch (error) {
      console.error('Error fetching ride requests:', error);
    }
  }, [user]);

  // Convert first ride request to PendingRide format
  const nextPendingRide: PendingRide | null = rideRequests.length > 0
    ? {
        id: rideRequests[0].id,
        clientName: rideRequests[0].clientName,
        origin: rideRequests[0].origin,
        destination: rideRequests[0].destination,
        distance: rideRequests[0].distance,
        fare: rideRequests[0].fare,
        isShared: rideRequests[0].isShared,
        passengerCount: rideRequests[0].passengerCount,
        expiresIn: rideRequests[0].expiresIn,
      }
    : null;

  useEffect(() => {
    fetchTodayStats();
    fetchRideRequests();
  }, [fetchTodayStats, fetchRideRequests]);

  // Realtime subscription for new signals
  useEffect(() => {
    const channel = supabase
      .channel('driver-ride-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_signals',
        },
        () => {
          fetchRideRequests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_trips',
        },
        () => {
          fetchRideRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRideRequests]);

  return {
    stats,
    rideRequests,
    nextPendingRide,
    isLoading,
    refetchStats: fetchTodayStats,
    refetchRequests: fetchRideRequests,
  };
};

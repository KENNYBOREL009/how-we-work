import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Fleet Owner types
export interface AdminFleetOwner {
  id: string;
  user_id: string;
  company_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_verified: boolean;
  is_active: boolean;
  vehicle_count: number;
  driver_count: number;
  created_at: string;
}

// Bus Route types
export interface AdminBusRoute {
  id: string;
  name: string;
  route_number: string | null;
  start_point: string | null;
  end_point: string | null;
  color: string | null;
  is_active: boolean;
  stops_count: number;
  schedules_count: number;
}

// Bus Stop types
export interface AdminBusStop {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  is_active: boolean;
  routes_count: number;
}

// City Zone types
export interface AdminCityZone {
  id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  demand_score: number;
  active_signals_count: number;
  is_active: boolean;
}

// Contribution types
export interface AdminContribution {
  id: string;
  user_id: string;
  contributor_name: string | null;
  contribution_type: string;
  local_name: string | null;
  official_name: string | null;
  status: string;
  votes_positive: number;
  votes_negative: number;
  points_awarded: number | null;
  created_at: string;
}

// Scheduled Trip types
export interface AdminScheduledTrip {
  id: string;
  client_name: string | null;
  driver_name: string | null;
  origin: string;
  destination: string;
  scheduled_at: string;
  estimated_fare: number;
  status: string;
  created_at: string;
}

// Reward types
export interface AdminReward {
  id: string;
  name: string;
  description: string | null;
  category: string;
  points_cost: number;
  value_fcfa: number | null;
  stock: number | null;
  is_active: boolean;
  redemptions_count: number;
}

// Financial Stats types
export interface AdminFinancialStats {
  total_wallet_balance: number;
  total_locked_amount: number;
  active_holds_count: number;
  active_holds_amount: number;
  total_penalties_collected: number;
  revenue_this_week: number;
  revenue_this_month: number;
  avg_trip_fare: number;
}

export const useAdminExtended = () => {
  const { toast } = useToast();
  const [fleetOwners, setFleetOwners] = useState<AdminFleetOwner[]>([]);
  const [busRoutes, setBusRoutes] = useState<AdminBusRoute[]>([]);
  const [busStops, setBusStops] = useState<AdminBusStop[]>([]);
  const [cityZones, setCityZones] = useState<AdminCityZone[]>([]);
  const [contributions, setContributions] = useState<AdminContribution[]>([]);
  const [scheduledTrips, setScheduledTrips] = useState<AdminScheduledTrip[]>([]);
  const [rewards, setRewards] = useState<AdminReward[]>([]);
  const [financialStats, setFinancialStats] = useState<AdminFinancialStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFleetOwners = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_fleet_owners');
      if (error) throw error;
      setFleetOwners(data as AdminFleetOwner[]);
    } catch (error) {
      console.error('Error fetching fleet owners:', error);
    }
  }, []);

  const fetchBusRoutes = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_bus_routes');
      if (error) throw error;
      setBusRoutes(data as AdminBusRoute[]);
    } catch (error) {
      console.error('Error fetching bus routes:', error);
    }
  }, []);

  const fetchBusStops = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_bus_stops');
      if (error) throw error;
      setBusStops(data as AdminBusStop[]);
    } catch (error) {
      console.error('Error fetching bus stops:', error);
    }
  }, []);

  const fetchCityZones = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_city_zones');
      if (error) throw error;
      setCityZones(data as AdminCityZone[]);
    } catch (error) {
      console.error('Error fetching city zones:', error);
    }
  }, []);

  const fetchContributions = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_contributions');
      if (error) throw error;
      setContributions(data as AdminContribution[]);
    } catch (error) {
      console.error('Error fetching contributions:', error);
    }
  }, []);

  const fetchScheduledTrips = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_scheduled_trips');
      if (error) throw error;
      setScheduledTrips(data as AdminScheduledTrip[]);
    } catch (error) {
      console.error('Error fetching scheduled trips:', error);
    }
  }, []);

  const fetchRewards = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_rewards');
      if (error) throw error;
      setRewards(data as AdminReward[]);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    }
  }, []);

  const fetchFinancialStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_financial_stats');
      if (error) throw error;
      setFinancialStats(data as unknown as AdminFinancialStats);
    } catch (error) {
      console.error('Error fetching financial stats:', error);
    }
  }, []);

  const toggleFleetVerification = useCallback(async (fleetOwnerId: string) => {
    try {
      const { error } = await supabase.rpc('admin_toggle_fleet_verification', {
        p_fleet_owner_id: fleetOwnerId,
      });
      if (error) throw error;
      toast({ title: 'Statut de vérification modifié' });
      await fetchFleetOwners();
    } catch (error) {
      console.error('Error toggling verification:', error);
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  }, [toast, fetchFleetOwners]);

  const validateContribution = useCallback(async (contributionId: string, approve: boolean) => {
    try {
      const { error } = await supabase.rpc('admin_validate_contribution', {
        p_contribution_id: contributionId,
        p_approve: approve,
      });
      if (error) throw error;
      toast({ title: approve ? 'Contribution approuvée' : 'Contribution rejetée' });
      await fetchContributions();
    } catch (error) {
      console.error('Error validating contribution:', error);
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  }, [toast, fetchContributions]);

  const refreshAllExtendedData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      fetchFleetOwners(),
      fetchBusRoutes(),
      fetchBusStops(),
      fetchCityZones(),
      fetchContributions(),
      fetchScheduledTrips(),
      fetchRewards(),
      fetchFinancialStats(),
    ]);
    setIsLoading(false);
  }, [
    fetchFleetOwners,
    fetchBusRoutes,
    fetchBusStops,
    fetchCityZones,
    fetchContributions,
    fetchScheduledTrips,
    fetchRewards,
    fetchFinancialStats,
  ]);

  return {
    // Data
    fleetOwners,
    busRoutes,
    busStops,
    cityZones,
    contributions,
    scheduledTrips,
    rewards,
    financialStats,
    isLoading,
    // Fetch functions
    fetchFleetOwners,
    fetchBusRoutes,
    fetchBusStops,
    fetchCityZones,
    fetchContributions,
    fetchScheduledTrips,
    fetchRewards,
    fetchFinancialStats,
    refreshAllExtendedData,
    // Actions
    toggleFleetVerification,
    validateContribution,
  };
};

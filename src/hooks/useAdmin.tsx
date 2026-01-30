import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface AdminStats {
  total_users: number;
  active_vehicles: number;
  trips_today: number;
  revenue_today: number;
  total_fleet_owners: number;
  pending_reservations: number;
  total_drivers: number;
  active_trips: number;
}

export interface AdminUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: string[] | null;
}

export interface AdminVehicle {
  id: string;
  plate_number: string;
  vehicle_type: string;
  status: string;
  driver_id: string | null;
  driver_name: string | null;
  destination: string | null;
  current_passengers: number;
  capacity: number;
  is_active: boolean;
  created_at: string;
}

export interface AdminTrip {
  id: string;
  user_id: string;
  user_name: string | null;
  origin: string | null;
  destination: string | null;
  fare: number | null;
  status: string;
  trip_type: string;
  created_at: string;
  completed_at: string | null;
}

type AppRole = 'admin' | 'moderator' | 'user' | 'driver' | 'fleet_owner';

export const useAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [trips, setTrips] = useState<AdminTrip[]>([]);

  // Check if user is admin
  const checkAdminStatus = useCallback(async () => {
    if (!user?.id) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('is_admin', { _user_id: user.id });

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data === true);
      }
    } catch (error) {
      console.error('Error in checkAdminStatus:', error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats');

      if (error) {
        console.error('Error fetching admin stats:', error);
        return;
      }

      setStats(data as unknown as AdminStats);
    } catch (error) {
      console.error('Error in fetchStats:', error);
    }
  }, [isAdmin]);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase.rpc('admin_get_users');

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setUsers(data as AdminUser[]);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
    }
  }, [isAdmin]);

  // Fetch all vehicles
  const fetchVehicles = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase.rpc('admin_get_vehicles');

      if (error) {
        console.error('Error fetching vehicles:', error);
        return;
      }

      setVehicles(data as AdminVehicle[]);
    } catch (error) {
      console.error('Error in fetchVehicles:', error);
    }
  }, [isAdmin]);

  // Fetch all trips
  const fetchTrips = useCallback(async (limit = 50, offset = 0) => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase.rpc('admin_get_trips', {
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        console.error('Error fetching trips:', error);
        return;
      }

      setTrips(data as AdminTrip[]);
    } catch (error) {
      console.error('Error in fetchTrips:', error);
    }
  }, [isAdmin]);

  // Assign role to user
  const assignRole = useCallback(async (userId: string, role: AppRole) => {
    if (!isAdmin) return false;

    try {
      const { error } = await supabase.rpc('admin_assign_role', {
        p_user_id: userId,
        p_role: role,
      });

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Rôle assigné',
        description: `Le rôle ${role} a été assigné avec succès`,
      });

      await fetchUsers();
      return true;
    } catch (error) {
      console.error('Error assigning role:', error);
      return false;
    }
  }, [isAdmin, toast, fetchUsers]);

  // Remove role from user
  const removeRole = useCallback(async (userId: string, role: AppRole) => {
    if (!isAdmin) return false;

    try {
      const { error } = await supabase.rpc('admin_remove_role', {
        p_user_id: userId,
        p_role: role,
      });

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Rôle retiré',
        description: `Le rôle ${role} a été retiré avec succès`,
      });

      await fetchUsers();
      return true;
    } catch (error) {
      console.error('Error removing role:', error);
      return false;
    }
  }, [isAdmin, toast, fetchUsers]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchVehicles(),
      fetchTrips(),
    ]);
  }, [fetchStats, fetchUsers, fetchVehicles, fetchTrips]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  useEffect(() => {
    if (isAdmin) {
      refreshData();
    }
  }, [isAdmin, refreshData]);

  return {
    isAdmin,
    isLoading,
    stats,
    users,
    vehicles,
    trips,
    fetchStats,
    fetchUsers,
    fetchVehicles,
    fetchTrips,
    assignRole,
    removeRole,
    refreshData,
  };
};

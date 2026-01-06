import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Vehicle {
  id: string;
  vehicle_type: 'bus' | 'taxi';
  plate_number: string;
  capacity: number;
  destination: string | null;
  status: 'available' | 'full' | 'private' | 'offline';
  latitude?: number;
  longitude?: number;
  heading?: number;
  speed?: number;
}

export interface BusStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
}

export interface BusRoute {
  id: string;
  name: string;
  description: string | null;
  color: string;
}

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const [busRoutes, setBusRoutes] = useState<BusRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVehicles = async () => {
    // Fetch vehicles with their latest position
    const { data: vehiclesData, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('is_active', true);

    if (vehiclesError) {
      console.error('Error fetching vehicles:', vehiclesError);
      return;
    }

    // Get latest position for each vehicle
    const vehiclesWithPositions: Vehicle[] = await Promise.all(
      (vehiclesData || []).map(async (vehicle) => {
        const { data: posData } = await supabase
          .from('vehicle_positions')
          .select('latitude, longitude, heading, speed')
          .eq('vehicle_id', vehicle.id)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...vehicle,
          vehicle_type: vehicle.vehicle_type as 'bus' | 'taxi',
          status: vehicle.status as 'available' | 'full' | 'private' | 'offline',
          latitude: posData?.latitude,
          longitude: posData?.longitude,
          heading: posData?.heading,
          speed: posData?.speed,
        };
      })
    );

    setVehicles(vehiclesWithPositions);
  };

  const fetchBusStops = async () => {
    const { data, error } = await supabase
      .from('bus_stops')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching bus stops:', error);
      return;
    }

    setBusStops(data || []);
  };

  const fetchBusRoutes = async () => {
    const { data, error } = await supabase
      .from('bus_routes')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching bus routes:', error);
      return;
    }

    setBusRoutes(data || []);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchVehicles(), fetchBusStops(), fetchBusRoutes()]);
      setIsLoading(false);
    };

    loadData();

    // Subscribe to realtime updates for vehicle positions
    const channel = supabase
      .channel('vehicle-positions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_positions',
        },
        () => {
          // Refetch vehicles when positions update
          fetchVehicles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    vehicles,
    busStops,
    busRoutes,
    isLoading,
    refetch: fetchVehicles,
  };
};

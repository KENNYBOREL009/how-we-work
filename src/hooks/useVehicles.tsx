import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type RideModeType = 'standard' | 'confort-partage' | 'privatisation';

export interface Vehicle {
  id: string;
  vehicle_type: 'bus' | 'taxi' | 'vtc';
  plate_number: string;
  capacity: number;
  destination: string | null;
  status: 'available' | 'full' | 'private' | 'offline';
  operator?: string;
  latitude?: number;
  longitude?: number;
  heading?: number;
  speed?: number;
  // Champs pour courses partagées
  ride_mode?: RideModeType;
  current_passengers?: number;
  shared_ride_origin?: string | null;
  shared_ride_fare_per_km?: number;
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
          id: vehicle.id,
          vehicle_type: vehicle.vehicle_type as 'bus' | 'taxi' | 'vtc',
          plate_number: vehicle.plate_number,
          capacity: vehicle.capacity || 4,
          destination: vehicle.destination,
          status: vehicle.status as 'available' | 'full' | 'private' | 'offline',
          operator: vehicle.operator || 'SOCATUR',
          ride_mode: (vehicle.ride_mode || 'standard') as RideModeType,
          current_passengers: vehicle.current_passengers || 0,
          shared_ride_origin: vehicle.shared_ride_origin,
          shared_ride_fare_per_km: vehicle.shared_ride_fare_per_km || 200,
          latitude: posData?.latitude,
          longitude: posData?.longitude,
          heading: posData?.heading,
          speed: posData?.speed,
        };
      })
    );

    // Ajouter des taxis jaunes simulés pour la démo
    const mockYellowTaxis: Vehicle[] = [
      {
        id: 'taxi-yellow-1',
        vehicle_type: 'taxi',
        plate_number: 'LT 1234 A',
        capacity: 4,
        destination: 'Bonanjo',
        status: 'available',
        operator: 'Taxi Jaune Douala',
        ride_mode: 'standard',
        current_passengers: 1,
        shared_ride_origin: null,
        shared_ride_fare_per_km: 100,
        latitude: 4.0525,
        longitude: 9.7055,
        heading: 45,
        speed: 30,
      },
      {
        id: 'taxi-yellow-2',
        vehicle_type: 'taxi',
        plate_number: 'LT 5678 B',
        capacity: 4,
        destination: 'Akwa',
        status: 'available',
        operator: 'Taxi Express',
        ride_mode: 'standard',
        current_passengers: 0,
        shared_ride_origin: null,
        shared_ride_fare_per_km: 100,
        latitude: 4.0495,
        longitude: 9.7025,
        heading: 120,
        speed: 25,
      },
      {
        id: 'taxi-yellow-3',
        vehicle_type: 'taxi',
        plate_number: 'LT 9012 C',
        capacity: 4,
        destination: 'Deido',
        status: 'available',
        operator: 'Taxi Rapide',
        ride_mode: 'standard',
        current_passengers: 2,
        shared_ride_origin: null,
        shared_ride_fare_per_km: 100,
        latitude: 4.0545,
        longitude: 9.7085,
        heading: 220,
        speed: 35,
      },
      {
        id: 'taxi-yellow-4',
        vehicle_type: 'taxi',
        plate_number: 'LT 3456 D',
        capacity: 4,
        destination: 'Bonapriso',
        status: 'available',
        operator: 'Taxi Confort',
        ride_mode: 'standard',
        current_passengers: 0,
        shared_ride_origin: null,
        shared_ride_fare_per_km: 100,
        latitude: 4.0475,
        longitude: 9.7095,
        heading: 0,
        speed: 20,
      },
      {
        id: 'taxi-yellow-5',
        vehicle_type: 'taxi',
        plate_number: 'LT 7890 E',
        capacity: 4,
        destination: 'Makepe',
        status: 'available',
        operator: 'Taxi VIP',
        ride_mode: 'standard',
        current_passengers: 3,
        shared_ride_origin: null,
        shared_ride_fare_per_km: 100,
        latitude: 4.0560,
        longitude: 9.7010,
        heading: 300,
        speed: 40,
      },
      {
        id: 'taxi-yellow-6',
        vehicle_type: 'taxi',
        plate_number: 'LT 2468 F',
        capacity: 4,
        destination: null, // Taxi libre sans destination
        status: 'available',
        operator: 'Taxi Libre',
        ride_mode: 'standard',
        current_passengers: 0,
        shared_ride_origin: null,
        shared_ride_fare_per_km: 100,
        latitude: 4.0510,
        longitude: 9.7070,
        heading: 180,
        speed: 15,
      },
      {
        id: 'taxi-yellow-7',
        vehicle_type: 'taxi',
        plate_number: 'LT 1357 G',
        capacity: 4,
        destination: 'Bonaberi',
        status: 'available',
        operator: 'Taxi Inter',
        ride_mode: 'standard',
        current_passengers: 1,
        shared_ride_origin: null,
        shared_ride_fare_per_km: 100,
        latitude: 4.0488,
        longitude: 9.7120,
        heading: 90,
        speed: 28,
      },
      {
        id: 'taxi-yellow-8',
        vehicle_type: 'taxi',
        plate_number: 'LT 8642 H',
        capacity: 4,
        destination: 'Ndokoti',
        status: 'available',
        operator: 'Taxi Plus',
        ride_mode: 'standard',
        current_passengers: 2,
        shared_ride_origin: null,
        shared_ride_fare_per_km: 100,
        latitude: 4.0535,
        longitude: 9.6990,
        heading: 270,
        speed: 32,
      },
    ];

    // Ajouter des bus simulés actifs pour la démo
    const mockBuses: Vehicle[] = [
      {
        id: 'bus-socatur-1',
        vehicle_type: 'bus',
        plate_number: 'CE 001 SC',
        capacity: 70,
        destination: 'Bonabéri',
        status: 'available',
        operator: 'SOCATUR',
        ride_mode: 'standard',
        current_passengers: 32,
        shared_ride_origin: null,
        shared_ride_fare_per_km: 0,
        latitude: 4.0540,
        longitude: 9.7060,
        heading: 250,
        speed: 22,
      },
      {
        id: 'bus-socatur-2',
        vehicle_type: 'bus',
        plate_number: 'CE 002 SC',
        capacity: 70,
        destination: 'Akwa',
        status: 'available',
        operator: 'SOCATUR',
        ride_mode: 'standard',
        current_passengers: 55,
        shared_ride_origin: null,
        shared_ride_fare_per_km: 0,
        latitude: 4.0470,
        longitude: 9.7110,
        heading: 70,
        speed: 18,
      },
      {
        id: 'bus-socatur-3',
        vehicle_type: 'bus',
        plate_number: 'CE 003 SC',
        capacity: 50,
        destination: 'Ndokoti',
        status: 'full',
        operator: 'SOCATUR',
        ride_mode: 'standard',
        current_passengers: 50,
        shared_ride_origin: null,
        shared_ride_fare_per_km: 0,
        latitude: 4.0580,
        longitude: 9.7030,
        heading: 160,
        speed: 15,
      },
    ];

    // Ajouter des VTC partagés simulés pour la démo
    const mockSharedVTCs: Vehicle[] = [
      {
        id: 'vtc-shared-1',
        vehicle_type: 'vtc',
        plate_number: 'CE 234 LT',
        capacity: 4,
        destination: 'Bonanjo',
        status: 'available',
        operator: 'VTC Premium',
        ride_mode: 'confort-partage',
        current_passengers: 2,
        shared_ride_origin: 'Akwa',
        shared_ride_fare_per_km: 180,
        latitude: 4.0531,
        longitude: 9.7083,
        heading: 45,
        speed: 25,
      },
      {
        id: 'vtc-shared-2',
        vehicle_type: 'vtc',
        plate_number: 'CE 567 LT',
        capacity: 4,
        destination: 'Bonapriso',
        status: 'available',
        operator: 'VTC Confort',
        ride_mode: 'confort-partage',
        current_passengers: 1,
        shared_ride_origin: 'Deido',
        shared_ride_fare_per_km: 200,
        latitude: 4.0481,
        longitude: 9.7123,
        heading: 180,
        speed: 30,
      },
      {
        id: 'vtc-shared-3',
        vehicle_type: 'vtc',
        plate_number: 'CE 891 LT',
        capacity: 4,
        destination: 'Makepe',
        status: 'available',
        operator: 'Elite Ride',
        ride_mode: 'confort-partage',
        current_passengers: 3,
        shared_ride_origin: 'Akwa Nord',
        shared_ride_fare_per_km: 150,
        latitude: 4.0551,
        longitude: 9.6983,
        heading: 90,
        speed: 20,
      },
    ];

    setVehicles([...vehiclesWithPositions, ...mockYellowTaxis, ...mockBuses, ...mockSharedVTCs]);
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

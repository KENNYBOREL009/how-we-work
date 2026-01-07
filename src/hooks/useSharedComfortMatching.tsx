import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { SeatPreference } from '@/components/comfort';

interface CompatibleVehicle {
  vehicle_id: string;
  driver_id: string;
  plate_number: string;
  current_passengers: number;
  available_seats: number;
  vehicle_lat: number;
  vehicle_lng: number;
  destination: string | null;
  distance_to_pickup_km: number;
  heading: number | null;
  direction_compatibility: number;
  estimated_detour_minutes: number;
  fare_per_km: number;
}

interface MatchResult {
  vehicle: CompatibleVehicle;
  driver: {
    id: string;
    name: string;
    rating: number;
    vehicleModel: string;
    plateNumber: string;
    eta: number;
  };
  currentPassengers: number;
  sharedPrice: number;
  detourMinutes: number;
  requestId: string;
}

interface UseSharedComfortMatchingReturn {
  isSearching: boolean;
  matchResult: MatchResult | null;
  availableVehiclesCount: number;
  searchForMatch: (params: SearchParams) => Promise<MatchResult | null>;
  acceptMatch: (requestId: string) => Promise<boolean>;
  declineMatch: (requestId: string) => Promise<void>;
  cancelSearch: () => void;
  refreshAvailability: () => Promise<void>;
}

interface SearchParams {
  originLat: number;
  originLng: number;
  originName?: string;
  destinationLat: number;
  destinationLng: number;
  destinationName?: string;
  seatPreference: SeatPreference;
  estimatedDistanceKm: number;
}

// Noms de chauffeurs simulés pour l'affichage
const MOCK_DRIVER_NAMES = [
  'Paul Kamdem', 'Jean Mbarga', 'Marie Essomba', 'François Nkodo',
  'Sophie Atangana', 'Pierre Fouda', 'Claire Ngono', 'Marc Eyenga'
];

const MOCK_VEHICLE_MODELS = [
  'Toyota Camry', 'Honda Accord', 'Hyundai Sonata', 'Nissan Altima',
  'Kia Optima', 'Toyota Corolla', 'Mazda 6', 'Peugeot 508'
];

export const useSharedComfortMatching = (): UseSharedComfortMatchingReturn => {
  const { user } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [availableVehiclesCount, setAvailableVehiclesCount] = useState(0);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);

  // Refresh available vehicles count (for zone indicator)
  const refreshAvailability = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('ride_mode', 'shared')
        .in('status', ['available', 'busy'])
        .lt('current_passengers', 4);

      if (!error && count !== null) {
        setAvailableVehiclesCount(count);
      }
    } catch (err) {
      console.error('Error refreshing availability:', err);
    }
  }, []);

  // Search for a matching vehicle
  const searchForMatch = useCallback(async (params: SearchParams): Promise<MatchResult | null> => {
    if (!user) {
      toast.error('Connexion requise');
      return null;
    }

    setIsSearching(true);
    setMatchResult(null);

    try {
      // 1. Call the database function to find compatible vehicles
      const { data: vehicles, error: vehicleError } = await supabase.rpc(
        'find_compatible_vehicles',
        {
          p_origin_lat: params.originLat,
          p_origin_lng: params.originLng,
          p_destination_lat: params.destinationLat,
          p_destination_lng: params.destinationLng,
          p_max_detour_minutes: 5,
          p_seat_preference: params.seatPreference
        }
      );

      if (vehicleError) {
        console.error('Error finding vehicles:', vehicleError);
        // Fallback to mock data if no real vehicles
      }

      let selectedVehicle: CompatibleVehicle | null = null;
      let isMock = false;

      if (vehicles && vehicles.length > 0) {
        // Use real vehicle data
        selectedVehicle = vehicles[0] as CompatibleVehicle;
      } else {
        // No real vehicles - use mock for demo
        isMock = true;
        selectedVehicle = {
          vehicle_id: `mock-${Date.now()}`,
          driver_id: `driver-${Date.now()}`,
          plate_number: `LT ${Math.floor(1000 + Math.random() * 9000)} C`,
          current_passengers: Math.floor(Math.random() * 3),
          available_seats: 4 - Math.floor(Math.random() * 3),
          vehicle_lat: params.originLat + (Math.random() - 0.5) * 0.02,
          vehicle_lng: params.originLng + (Math.random() - 0.5) * 0.02,
          destination: params.destinationName || 'Direction similaire',
          distance_to_pickup_km: 0.5 + Math.random() * 1.5,
          heading: null,
          direction_compatibility: 75 + Math.random() * 25,
          estimated_detour_minutes: Math.floor(1 + Math.random() * 4),
          fare_per_km: 200
        };
      }

      // 2. Create the request in database
      const estimatedFare = Math.round(params.estimatedDistanceKm * selectedVehicle.fare_per_km);
      
      const { data: request, error: requestError } = await supabase
        .from('shared_comfort_requests')
        .insert({
          user_id: user.id,
          origin_lat: params.originLat,
          origin_lng: params.originLng,
          origin_name: params.originName,
          destination_lat: params.destinationLat,
          destination_lng: params.destinationLng,
          destination_name: params.destinationName,
          seat_preference: params.seatPreference,
          estimated_distance_km: params.estimatedDistanceKm,
          estimated_fare: estimatedFare,
          status: 'matched',
          matched_vehicle_id: isMock ? null : selectedVehicle.vehicle_id,
          matched_at: new Date().toISOString(),
          detour_minutes: selectedVehicle.estimated_detour_minutes,
          current_passengers_count: selectedVehicle.current_passengers
        })
        .select()
        .single();

      if (requestError) {
        console.error('Error creating request:', requestError);
        toast.error('Erreur lors de la création de la demande');
        setIsSearching(false);
        return null;
      }

      // 3. Build the match result
      const result: MatchResult = {
        vehicle: selectedVehicle,
        driver: {
          id: selectedVehicle.driver_id,
          name: MOCK_DRIVER_NAMES[Math.floor(Math.random() * MOCK_DRIVER_NAMES.length)],
          rating: 4.5 + Math.random() * 0.5,
          vehicleModel: MOCK_VEHICLE_MODELS[Math.floor(Math.random() * MOCK_VEHICLE_MODELS.length)],
          plateNumber: selectedVehicle.plate_number,
          eta: Math.ceil(selectedVehicle.distance_to_pickup_km * 2 + 1) // ~2min/km + 1min
        },
        currentPassengers: selectedVehicle.current_passengers,
        sharedPrice: estimatedFare,
        detourMinutes: selectedVehicle.estimated_detour_minutes,
        requestId: request.id
      };

      setMatchResult(result);
      setCurrentRequestId(request.id);
      setIsSearching(false);

      return result;
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Erreur lors de la recherche');
      setIsSearching(false);
      return null;
    }
  }, [user]);

  // Accept the matched ride
  const acceptMatch = useCallback(async (requestId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('shared_comfort_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error accepting match:', error);
        toast.error('Erreur lors de l\'acceptation');
        return false;
      }

      toast.success('Trajet confirmé !');
      return true;
    } catch (err) {
      console.error('Accept error:', err);
      return false;
    }
  }, [user]);

  // Decline the matched ride
  const declineMatch = useCallback(async (requestId: string): Promise<void> => {
    if (!user) return;

    try {
      await supabase
        .from('shared_comfort_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .eq('user_id', user.id);

      setMatchResult(null);
      setCurrentRequestId(null);
    } catch (err) {
      console.error('Decline error:', err);
    }
  }, [user]);

  // Cancel ongoing search
  const cancelSearch = useCallback(() => {
    setIsSearching(false);
    setMatchResult(null);
    
    if (currentRequestId) {
      supabase
        .from('shared_comfort_requests')
        .update({ status: 'cancelled' })
        .eq('id', currentRequestId)
        .then(() => setCurrentRequestId(null));
    }
  }, [currentRequestId]);

  return {
    isSearching,
    matchResult,
    availableVehiclesCount,
    searchForMatch,
    acceptMatch,
    declineMatch,
    cancelSearch,
    refreshAvailability
  };
};

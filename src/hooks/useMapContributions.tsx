import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface MapContribution {
  id: string;
  user_id: string;
  contribution_type: 'local_name' | 'road_trace' | 'error_report';
  status: 'pending' | 'validated' | 'rejected';
  latitude: number;
  longitude: number;
  local_name?: string | null;
  official_name?: string | null;
  photo_url?: string | null;
  route_trace?: unknown;
  route_length_km?: number | null;
  is_new_road?: boolean | null;
  error_type?: 'road_blocked' | 'one_way' | 'non_existent' | 'other' | null;
  error_description?: string | null;
  mapbox_poi_id?: string | null;
  votes_positive: number;
  votes_negative: number;
  votes_unknown: number;
  points_awarded: number;
  created_at: string;
}

export interface NearbyContribution {
  contribution: MapContribution;
  distance_km: number;
}

export interface UserPoints {
  total_points: number;
  current_points: number;
  level_name: string;
  next_level_threshold: number;
  contributions_count: number;
  validations_count: number;
}

interface MapboxPOI {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export const useMapContributions = () => {
  const { user } = useAuth();
  const [contributions, setContributions] = useState<MapContribution[]>([]);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nearbyPending, setNearbyPending] = useState<NearbyContribution[]>([]);

  // Fetch user's contributions
  const fetchContributions = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('map_contributions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setContributions(data as MapContribution[]);
    } catch (error) {
      console.error('Error fetching contributions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch user points
  const fetchUserPoints = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setUserPoints({
          total_points: data.total_points,
          current_points: data.current_points,
          level_name: data.level_name,
          next_level_threshold: data.next_level_threshold,
          contributions_count: data.contributions_count,
          validations_count: data.validations_count,
        });
      }
    } catch (error) {
      console.error('Error fetching user points:', error);
    }
  }, [user]);

  // Check for nearby POIs using Mapbox Geocoding API
  const checkNearbyPOI = async (lat: number, lng: number): Promise<MapboxPOI | null> => {
    try {
      const { data: tokenData } = await supabase.functions.invoke('get-mapbox-token');
      if (!tokenData?.token) return null;

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=poi&limit=1&access_token=${tokenData.token}`
      );
      
      if (!response.ok) return null;
      
      const result = await response.json();
      
      if (result.features && result.features.length > 0) {
        const poi = result.features[0];
        const [poiLng, poiLat] = poi.center;
        
        // Check if within 20 meters
        const distance = getDistanceKm(lat, lng, poiLat, poiLng) * 1000;
        if (distance < 20) {
          return {
            id: poi.id,
            name: poi.text,
            latitude: poiLat,
            longitude: poiLng,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error checking nearby POI:', error);
      return null;
    }
  };

  // Add a local name contribution
  const addLocalName = async (
    lat: number, 
    lng: number, 
    localName: string, 
    photoUrl?: string
  ): Promise<{ success: boolean; isAlias?: boolean; officialName?: string }> => {
    if (!user) {
      toast.error('Connectez-vous pour contribuer');
      return { success: false };
    }

    try {
      // Check for nearby POI (duplicate detection)
      const nearbyPOI = await checkNearbyPOI(lat, lng);
      
      const { error } = await supabase
        .from('map_contributions')
        .insert({
          user_id: user.id,
          contribution_type: 'local_name',
          latitude: lat,
          longitude: lng,
          local_name: localName,
          official_name: nearbyPOI?.name || null,
          mapbox_poi_id: nearbyPOI?.id || null,
          photo_url: photoUrl,
        });

      if (error) throw error;

      toast.success(
        nearbyPOI 
          ? `Surnom "${localName}" ajouté pour "${nearbyPOI.name}"`
          : `Lieu "${localName}" ajouté, en attente de validation`
      );
      
      await fetchContributions();
      return { 
        success: true, 
        isAlias: !!nearbyPOI, 
        officialName: nearbyPOI?.name 
      };
    } catch (error) {
      console.error('Error adding local name:', error);
      toast.error('Erreur lors de l\'ajout du lieu');
      return { success: false };
    }
  };

  // Add a road trace contribution
  const addRoadTrace = async (
    trace: { lat: number; lng: number }[],
    isNewRoad: boolean = false
  ): Promise<boolean> => {
    if (!user || trace.length < 2) return false;

    try {
      // Calculate trace length
      let lengthKm = 0;
      for (let i = 1; i < trace.length; i++) {
        lengthKm += getDistanceKm(
          trace[i - 1].lat, trace[i - 1].lng,
          trace[i].lat, trace[i].lng
        );
      }

      const { error } = await supabase
        .from('map_contributions')
        .insert({
          user_id: user.id,
          contribution_type: 'road_trace',
          latitude: trace[0].lat,
          longitude: trace[0].lng,
          route_trace: trace,
          route_length_km: lengthKm,
          is_new_road: isNewRoad,
        });

      if (error) throw error;

      toast.success(`Tracé de ${lengthKm.toFixed(2)} km enregistré`);
      await fetchContributions();
      return true;
    } catch (error) {
      console.error('Error adding road trace:', error);
      toast.error('Erreur lors de l\'enregistrement du tracé');
      return false;
    }
  };

  // Report an error
  const reportError = async (
    lat: number,
    lng: number,
    errorType: 'road_blocked' | 'one_way' | 'non_existent' | 'other',
    description?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('map_contributions')
        .insert({
          user_id: user.id,
          contribution_type: 'error_report',
          latitude: lat,
          longitude: lng,
          error_type: errorType,
          error_description: description,
        });

      if (error) throw error;

      toast.success('Erreur signalée, merci !');
      await fetchContributions();
      return true;
    } catch (error) {
      console.error('Error reporting:', error);
      toast.error('Erreur lors du signalement');
      return false;
    }
  };

  // Vote on a contribution
  const voteOnContribution = async (
    contributionId: string,
    vote: 'yes' | 'no' | 'unknown'
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('contribution_votes')
        .insert({
          contribution_id: contributionId,
          user_id: user.id,
          vote,
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('Vous avez déjà voté pour cette contribution');
        } else {
          throw error;
        }
        return false;
      }

      toast.success('+5 points pour votre validation !');
      await fetchUserPoints();
      return true;
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Erreur lors du vote');
      return false;
    }
  };

  // Fetch pending contributions near a location
  const fetchNearbyPending = useCallback(async (lat: number, lng: number, radiusKm: number = 0.5) => {
    try {
      const { data, error } = await supabase
        .from('map_contributions')
        .select('*')
        .eq('status', 'pending');

      if (error) throw error;

      const nearby: NearbyContribution[] = (data as MapContribution[])
        .map(contrib => ({
          contribution: contrib,
          distance_km: getDistanceKm(lat, lng, contrib.latitude, contrib.longitude),
        }))
        .filter(item => item.distance_km <= radiusKm)
        .sort((a, b) => a.distance_km - b.distance_km);

      setNearbyPending(nearby);
    } catch (error) {
      console.error('Error fetching nearby pending:', error);
    }
  }, []);

  useEffect(() => {
    fetchContributions();
    fetchUserPoints();
  }, [fetchContributions, fetchUserPoints]);

  return {
    contributions,
    userPoints,
    isLoading,
    nearbyPending,
    addLocalName,
    addRoadTrace,
    reportError,
    voteOnContribution,
    fetchNearbyPending,
    refreshPoints: fetchUserPoints,
  };
};

// Haversine distance calculation
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

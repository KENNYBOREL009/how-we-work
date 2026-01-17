import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SurgeZone {
  id: string;
  zoneName: string;
  centerLat: number;
  centerLng: number;
  demandCount: number;
  driverCount: number;
  surgeMultiplier: number;
  expiresAt: string;
}

interface UseSurgePricingReturn {
  surgeZones: SurgeZone[];
  isLoading: boolean;
  getSurgeForLocation: (lat: number, lng: number) => number;
  calculateFareWithSurge: (baseFare: number, lat: number, lng: number) => number;
  highDemandZones: SurgeZone[];
  refreshSurgeData: () => Promise<void>;
}

export const useSurgePricing = (): UseSurgePricingReturn => {
  const [surgeZones, setSurgeZones] = useState<SurgeZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSurgeZones = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('surge_pricing_zones')
        .select('*')
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString());

      if (error) throw error;

      const zones: SurgeZone[] = (data || []).map(z => ({
        id: z.id,
        zoneName: z.zone_name,
        centerLat: z.center_lat,
        centerLng: z.center_lng,
        demandCount: z.demand_count || 0,
        driverCount: z.driver_count || 0,
        surgeMultiplier: Number(z.surge_multiplier) || 1,
        expiresAt: z.expires_at || ''
      }));

      setSurgeZones(zones);
    } catch (error) {
      console.error("Error fetching surge zones:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSurgeZones();

    // Refresh every 5 minutes
    const interval = setInterval(fetchSurgeZones, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchSurgeZones]);

  const getSurgeForLocation = useCallback((lat: number, lng: number): number => {
    // Find the closest zone within 3km
    const RADIUS_KM = 3;
    
    for (const zone of surgeZones) {
      const distance = calculateDistance(lat, lng, zone.centerLat, zone.centerLng);
      if (distance <= RADIUS_KM) {
        return zone.surgeMultiplier;
      }
    }
    
    return 1.0; // No surge
  }, [surgeZones]);

  const calculateFareWithSurge = useCallback((
    baseFare: number, 
    lat: number, 
    lng: number
  ): number => {
    const multiplier = getSurgeForLocation(lat, lng);
    return Math.round(baseFare * multiplier);
  }, [getSurgeForLocation]);

  const highDemandZones = surgeZones.filter(z => z.surgeMultiplier > 1);

  return {
    surgeZones,
    isLoading,
    getSurgeForLocation,
    calculateFareWithSurge,
    highDemandZones,
    refreshSurgeData: fetchSurgeZones
  };
};

// Helper function for distance calculation
function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

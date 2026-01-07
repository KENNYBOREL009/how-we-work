import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface CityZone {
  id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
}

export interface DriverIntention {
  id: string;
  driver_id: string;
  target_zone_id?: string;
  target_zone_name?: string;
  intended_date: string;
  start_time: string;
  end_time?: string;
  is_high_demand_zone: boolean;
}

export interface PassengerRoutine {
  id: string;
  user_id: string;
  routine_name: string;
  origin_name: string;
  origin_lat: number;
  origin_lng: number;
  destination_name: string;
  destination_lat: number;
  destination_lng: number;
  typical_departure_time?: string;
  days_of_week: number[];
  is_active: boolean;
  trip_count: number;
}

export interface DemandPrediction {
  zone_id: string;
  zone_name: string;
  center_lat: number;
  center_lng: number;
  predicted_demand: number;
  driver_supply: number;
  demand_level: 'low' | 'medium' | 'high';
}

export const useSmartRoutine = () => {
  const { user } = useAuth();
  const [zones, setZones] = useState<CityZone[]>([]);
  const [driverIntention, setDriverIntention] = useState<DriverIntention | null>(null);
  const [passengerRoutines, setPassengerRoutines] = useState<PassengerRoutine[]>([]);
  const [predictions, setPredictions] = useState<DemandPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch city zones
  const fetchZones = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('city_zones')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setZones(data as CityZone[]);
    } catch (error) {
      console.error('Error fetching zones:', error);
    }
  }, []);

  // Fetch driver's intention for tomorrow
  const fetchDriverIntention = useCallback(async () => {
    if (!user) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    try {
      const { data, error } = await supabase
        .from('driver_intentions')
        .select('*')
        .eq('driver_id', user.id)
        .eq('intended_date', tomorrowStr)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setDriverIntention(data as DriverIntention | null);
    } catch (error) {
      console.error('Error fetching driver intention:', error);
    }
  }, [user]);

  // Set driver intention for tomorrow
  const setDriverWorkZone = async (
    zoneId: string | null,
    zoneName: string,
    startTime: string,
    endTime?: string
  ): Promise<boolean> => {
    if (!user) return false;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    try {
      // Check if zone is high demand
      const zone = zones.find(z => z.id === zoneId);
      const prediction = predictions.find(p => p.zone_id === zoneId);
      const isHighDemand = prediction?.demand_level === 'high';

      const { error } = await supabase
        .from('driver_intentions')
        .upsert({
          driver_id: user.id,
          target_zone_id: zoneId,
          target_zone_name: zoneName || zone?.name,
          intended_date: tomorrowStr,
          start_time: startTime,
          end_time: endTime,
          is_high_demand_zone: isHighDemand,
        }, {
          onConflict: 'driver_id,intended_date',
        });

      if (error) throw error;

      toast.success(
        isHighDemand 
          ? '🔥 Zone à forte demande enregistrée !' 
          : 'Intention enregistrée pour demain'
      );
      await fetchDriverIntention();
      return true;
    } catch (error) {
      console.error('Error setting driver work zone:', error);
      toast.error('Erreur lors de l\'enregistrement');
      return false;
    }
  };

  // Fetch passenger routines
  const fetchPassengerRoutines = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('passenger_routines')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPassengerRoutines(data as PassengerRoutine[]);
    } catch (error) {
      console.error('Error fetching routines:', error);
    }
  }, [user]);

  // Create or update a routine
  const saveRoutine = async (routine: Partial<PassengerRoutine>): Promise<boolean> => {
    if (!user) return false;

    try {
      if (routine.id) {
        const { id, user_id, ...updateData } = routine;
        const { error } = await supabase
          .from('passenger_routines')
          .update(updateData)
          .eq('id', routine.id);
        if (error) throw error;
      } else {
        const { id, ...insertData } = routine;
        const { error } = await supabase
          .from('passenger_routines')
          .insert({
            ...insertData,
            user_id: user.id,
          } as any);
        if (error) throw error;
      }

      toast.success('Routine sauvegardée');
      await fetchPassengerRoutines();
      return true;
    } catch (error) {
      console.error('Error saving routine:', error);
      toast.error('Erreur lors de la sauvegarde');
      return false;
    }
  };

  // Signal demand for tomorrow
  const signalDemand = async (
    originLat: number,
    originLng: number,
    destinationLat: number,
    destinationLng: number,
    departureTime: string,
    isFromRoutine: boolean = false
  ): Promise<boolean> => {
    if (!user) return false;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Find the zone for the origin
    const originZone = findNearestZone(originLat, originLng);

    try {
      const { error } = await supabase
        .from('demand_signals')
        .insert({
          user_id: user.id,
          zone_id: originZone?.id,
          zone_name: originZone?.name,
          signal_date: tomorrowStr,
          signal_time: departureTime,
          origin_lat: originLat,
          origin_lng: originLng,
          destination_lat: destinationLat,
          destination_lng: destinationLng,
          is_from_routine: isFromRoutine,
        });

      if (error) throw error;

      toast.success('Votre demande a été signalée aux chauffeurs');
      return true;
    } catch (error) {
      console.error('Error signaling demand:', error);
      toast.error('Erreur lors du signalement');
      return false;
    }
  };

  // Fetch demand predictions
  const fetchPredictions = useCallback(async (date?: Date, hour?: number) => {
    const targetDate = date || new Date();
    targetDate.setDate(targetDate.getDate() + 1);
    const dateStr = targetDate.toISOString().split('T')[0];
    const targetHour = hour ?? 7;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_predicted_demand', {
        p_date: dateStr,
        p_hour: targetHour,
      });

      if (error) throw error;
      setPredictions((data || []) as DemandPrediction[]);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Find nearest zone for a point
  const findNearestZone = (lat: number, lng: number): CityZone | null => {
    if (zones.length === 0) return null;

    let nearest: CityZone | null = null;
    let minDist = Infinity;

    for (const zone of zones) {
      const dist = getDistanceKm(lat, lng, zone.center_lat, zone.center_lng);
      if (dist < minDist && dist <= zone.radius_km) {
        minDist = dist;
        nearest = zone;
      }
    }
    return nearest;
  };

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  useEffect(() => {
    if (user) {
      fetchDriverIntention();
      fetchPassengerRoutines();
      fetchPredictions();
    }
  }, [user, fetchDriverIntention, fetchPassengerRoutines, fetchPredictions]);

  return {
    zones,
    driverIntention,
    passengerRoutines,
    predictions,
    isLoading,
    setDriverWorkZone,
    saveRoutine,
    signalDemand,
    fetchPredictions,
    findNearestZone,
  };
};

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

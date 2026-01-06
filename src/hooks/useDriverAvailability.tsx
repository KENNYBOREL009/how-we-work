import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface DriverAvailability {
  id: string;
  driver_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  origin_zone: string;
  destination_zone: string | null;
  vehicle_type: string;
  is_recurring: boolean;
  specific_date: string | null;
}

export interface DriverReliabilityScore {
  driver_id: string;
  total_scheduled_trips: number;
  completed_trips: number;
  no_show_count: number;
  late_count: number;
  acceptance_rate: number;
  punctuality_score: number;
  reliability_score: number;
  is_scheduling_blocked: boolean;
  blocked_until: string | null;
}

const DAYS_OF_WEEK = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export const getDayName = (dayIndex: number): string => DAYS_OF_WEEK[dayIndex] || '';

export const useDriverAvailability = () => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<DriverAvailability[]>([]);
  const [reliabilityScore, setReliabilityScore] = useState<DriverReliabilityScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAvailability();
      fetchReliabilityScore();
    }
  }, [user]);

  const fetchAvailability = async () => {
    if (!user) return;
    
    setLoading(true);
    
    const { data, error } = await supabase
      .from("driver_availability")
      .select("*")
      .eq("driver_id", user.id)
      .order("day_of_week", { ascending: true });

    if (error) {
      console.error("Error fetching availability:", error);
    } else {
      setAvailability((data as DriverAvailability[]) || []);
    }
    
    setLoading(false);
  };

  const fetchReliabilityScore = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("driver_reliability_scores")
      .select("*")
      .eq("driver_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching reliability score:", error);
    } else if (data) {
      setReliabilityScore(data as DriverReliabilityScore);
    }
  };

  const addAvailability = async (
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    originZone: string,
    destinationZone?: string,
    vehicleType: string = 'standard'
  ) => {
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("driver_availability")
      .insert({
        driver_id: user.id,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        origin_zone: originZone,
        destination_zone: destinationZone,
        vehicle_type: vehicleType,
        is_recurring: true,
      });

    if (error) throw error;
    await fetchAvailability();
  };

  const removeAvailability = async (availabilityId: string) => {
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("driver_availability")
      .delete()
      .eq("id", availabilityId)
      .eq("driver_id", user.id);

    if (error) throw error;
    await fetchAvailability();
  };

  return {
    availability,
    reliabilityScore,
    loading,
    addAvailability,
    removeAvailability,
    refetch: fetchAvailability,
    getDayName,
  };
};

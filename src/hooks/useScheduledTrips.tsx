import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ScheduledTrip {
  id: string;
  client_id: string;
  driver_id: string | null;
  origin: string;
  destination: string;
  scheduled_at: string;
  vehicle_type: string;
  estimated_fare: number;
  security_deposit: number;
  status: 'pending' | 'matched' | 'confirmed' | 'cancelled' | 'completed' | 'no_show_client' | 'no_show_driver';
  driver_accepted_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  penalty_amount: number;
  client_notes: string | null;
  driver_notes: string | null;
  matched_at: string | null;
  created_at: string;
}

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

// Prix par zone en FCFA
const ZONE_PRICES: Record<string, Record<string, number>> = {
  "Bonanjo": { "Akwa": 1500, "Deido": 2000, "Kotto": 3500, "Makepe": 3000, "Bonaberi": 2500 },
  "Akwa": { "Bonanjo": 1500, "Deido": 1500, "Kotto": 3000, "Makepe": 2500, "Bonaberi": 2000 },
  "Deido": { "Bonanjo": 2000, "Akwa": 1500, "Kotto": 2500, "Makepe": 2000, "Bonaberi": 1500 },
  "Kotto": { "Bonanjo": 3500, "Akwa": 3000, "Deido": 2500, "Makepe": 1500, "Bonaberi": 4000 },
  "Makepe": { "Bonanjo": 3000, "Akwa": 2500, "Deido": 2000, "Kotto": 1500, "Bonaberi": 3500 },
  "Bonaberi": { "Bonanjo": 2500, "Akwa": 2000, "Deido": 1500, "Kotto": 4000, "Makepe": 3500 },
};

export const calculateScheduledFare = (origin: string, destination: string, vehicleType: string): number => {
  const baseFare = ZONE_PRICES[origin]?.[destination] || 2500;
  const multiplier = vehicleType === 'confort' ? 1.5 : 1;
  return Math.round(baseFare * multiplier);
};

export const useScheduledTrips = () => {
  const { user } = useAuth();
  const [scheduledTrips, setScheduledTrips] = useState<ScheduledTrip[]>([]);
  const [pendingOffers, setPendingOffers] = useState<ScheduledTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchScheduledTrips();
    }
  }, [user]);

  const fetchScheduledTrips = async () => {
    if (!user) return;
    
    setLoading(true);
    
    // Fetch client's scheduled trips
    const { data: clientTrips, error: clientError } = await supabase
      .from("scheduled_trips")
      .select("*")
      .eq("client_id", user.id)
      .order("scheduled_at", { ascending: true });

    if (clientError) {
      console.error("Error fetching scheduled trips:", clientError);
    } else {
      setScheduledTrips((clientTrips as ScheduledTrip[]) || []);
    }

    // Fetch pending offers for drivers (trips without driver)
    const { data: offers, error: offersError } = await supabase
      .from("scheduled_trips")
      .select("*")
      .is("driver_id", null)
      .eq("status", "pending")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true });

    if (offersError) {
      console.error("Error fetching offers:", offersError);
    } else {
      setPendingOffers((offers as ScheduledTrip[]) || []);
    }
    
    setLoading(false);
  };

  const createScheduledTrip = async (
    origin: string,
    destination: string,
    scheduledAt: Date,
    vehicleType: string,
    notes?: string
  ) => {
    if (!user) throw new Error("User not authenticated");

    const estimatedFare = calculateScheduledFare(origin, destination, vehicleType);
    const securityDeposit = 500;

    const { data, error } = await supabase
      .from("scheduled_trips")
      .insert({
        client_id: user.id,
        origin,
        destination,
        scheduled_at: scheduledAt.toISOString(),
        vehicle_type: vehicleType,
        estimated_fare: estimatedFare,
        security_deposit: securityDeposit,
        client_notes: notes,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;
    
    await fetchScheduledTrips();
    return data;
  };

  const acceptTrip = async (tripId: string) => {
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("scheduled_trips")
      .update({
        driver_id: user.id,
        status: "confirmed",
        driver_accepted_at: new Date().toISOString(),
        matched_at: new Date().toISOString(),
      })
      .eq("id", tripId);

    if (error) throw error;
    await fetchScheduledTrips();
  };

  const cancelTrip = async (tripId: string, isDriver: boolean) => {
    if (!user) throw new Error("User not authenticated");

    const trip = scheduledTrips.find(t => t.id === tripId);
    if (!trip) throw new Error("Trip not found");

    // Check if cancellation is within 1 hour - apply penalty
    const scheduledTime = new Date(trip.scheduled_at);
    const now = new Date();
    const hoursUntilTrip = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const penaltyAmount = hoursUntilTrip < 1 ? trip.security_deposit : 0;

    const { error } = await supabase
      .from("scheduled_trips")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_by: isDriver ? "driver" : "client",
        penalty_amount: penaltyAmount,
      })
      .eq("id", tripId);

    if (error) throw error;
    await fetchScheduledTrips();
  };

  return {
    scheduledTrips,
    pendingOffers,
    loading,
    createScheduledTrip,
    acceptTrip,
    cancelTrip,
    refetch: fetchScheduledTrips,
  };
};

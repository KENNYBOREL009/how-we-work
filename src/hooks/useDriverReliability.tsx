import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface DriverReliabilityScore {
  reliabilityScore: number;
  punctualityScore: number;
  acceptanceRate: number;
  completedTrips: number;
  totalScheduledTrips: number;
  cancellationCount: number;
  ghostingCount: number;
  isSchedulingBlocked: boolean;
  blockedUntil: string | null;
  suspensionReason: string | null;
}

interface DriverDefaultResult {
  success: boolean;
  previousScore: number;
  newScore: number;
  penaltyApplied: number;
  isSuspended: boolean;
  blockedUntil: string | null;
  schedulingBlocked: boolean;
}

interface SuspensionStatus {
  isSuspended: boolean;
  blockedUntil: string | null;
  reason: string | null;
  currentScore: number;
}

export const useDriverReliability = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const getReliabilityScore = async (driverId?: string): Promise<DriverReliabilityScore | null> => {
    const targetDriverId = driverId || user?.id;
    if (!targetDriverId) return null;

    const { data, error } = await supabase
      .from("driver_reliability_scores")
      .select("*")
      .eq("driver_id", targetDriverId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching reliability score:", error);
      return null;
    }

    if (!data) {
      // Return default score if no record exists
      return {
        reliabilityScore: 100,
        punctualityScore: 100,
        acceptanceRate: 100,
        completedTrips: 0,
        totalScheduledTrips: 0,
        cancellationCount: 0,
        ghostingCount: 0,
        isSchedulingBlocked: false,
        blockedUntil: null,
        suspensionReason: null,
      };
    }

    return {
      reliabilityScore: Number(data.reliability_score) || 100,
      punctualityScore: Number(data.punctuality_score) || 100,
      acceptanceRate: Number(data.acceptance_rate) || 100,
      completedTrips: data.completed_trips || 0,
      totalScheduledTrips: data.total_scheduled_trips || 0,
      cancellationCount: (data as any).cancellation_count || 0,
      ghostingCount: (data as any).ghosting_count || 0,
      isSchedulingBlocked: data.is_scheduling_blocked || false,
      blockedUntil: data.blocked_until,
      suspensionReason: (data as any).suspension_reason,
    };
  };

  const handleDriverDefault = async (
    driverId: string,
    defaultType: 'cancellation' | 'ghosting',
    holdId?: string,
    tripId?: string
  ): Promise<DriverDefaultResult | null> => {
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("handle_driver_default", {
        p_driver_id: driverId,
        p_default_type: defaultType,
        p_hold_id: holdId || null,
        p_trip_id: tripId || null,
      });

      if (error) {
        console.error("Error handling driver default:", error);
        toast.error("Erreur lors du traitement");
        return null;
      }

      const result = data as any;
      
      return {
        success: result.success,
        previousScore: result.previous_score,
        newScore: result.new_score,
        penaltyApplied: result.penalty_applied,
        isSuspended: result.is_suspended,
        blockedUntil: result.blocked_until,
        schedulingBlocked: result.scheduling_blocked,
      };
    } catch (err) {
      console.error("Error handling driver default:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const canSeeReservations = async (driverId?: string): Promise<boolean> => {
    const targetDriverId = driverId || user?.id;
    if (!targetDriverId) return false;

    const { data, error } = await supabase.rpc("can_driver_see_reservations", {
      p_driver_id: targetDriverId,
    });

    if (error) {
      console.error("Error checking reservation access:", error);
      return true; // Default to true on error
    }

    return data as boolean;
  };

  const getSuspensionStatus = async (driverId?: string): Promise<SuspensionStatus> => {
    const targetDriverId = driverId || user?.id;
    if (!targetDriverId) {
      return { isSuspended: false, blockedUntil: null, reason: null, currentScore: 100 };
    }

    const { data, error } = await supabase.rpc("is_driver_suspended", {
      p_driver_id: targetDriverId,
    });

    if (error) {
      console.error("Error checking suspension status:", error);
      return { isSuspended: false, blockedUntil: null, reason: null, currentScore: 100 };
    }

    const result = data as any;
    return {
      isSuspended: result.is_suspended,
      blockedUntil: result.blocked_until,
      reason: result.reason,
      currentScore: result.current_score,
    };
  };

  return {
    loading,
    getReliabilityScore,
    handleDriverDefault,
    canSeeReservations,
    getSuspensionStatus,
  };
};

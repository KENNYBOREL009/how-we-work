import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface MatchedDriver {
  driverId: string;
  score: number;
  distanceKm: number;
  rating: number;
  acceptanceRate: number;
  hasHistory: boolean;
  rank: number;
}

interface RideRequest {
  id: string;
  origin: string;
  destination: string;
  estimatedFare: number;
  surgeMultiplier: number;
  finalFare: number;
  status: string;
  currentDriverId: string | null;
  matchedDriverId: string | null;
  tripId: string | null;
}

interface UseDriverMatchingReturn {
  isSearching: boolean;
  currentRequest: RideRequest | null;
  matchedDrivers: MatchedDriver[];
  countdown: number;
  createRideRequest: (params: {
    origin: string;
    originLat: number;
    originLng: number;
    destination: string;
    destinationLat: number;
    destinationLng: number;
    estimatedFare: number;
    vehicleType?: string;
    passengerCount?: number;
  }) => Promise<string | null>;
  cancelRequest: () => Promise<void>;
  respondToRequest: (requestId: string, response: 'accept' | 'decline') => Promise<boolean>;
}

const DRIVER_TIMEOUT_SECONDS = 30;

export const useDriverMatching = (): UseDriverMatchingReturn => {
  const { user } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<RideRequest | null>(null);
  const [matchedDrivers, setMatchedDrivers] = useState<MatchedDriver[]>([]);
  const [countdown, setCountdown] = useState(DRIVER_TIMEOUT_SECONDS);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Countdown timer for driver response
  useEffect(() => {
    if (isSearching && currentRequest?.currentDriverId) {
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // Driver timeout - notify next driver
            handleDriverTimeout();
            return DRIVER_TIMEOUT_SECONDS;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [isSearching, currentRequest?.currentDriverId]);

  const handleDriverTimeout = useCallback(async () => {
    if (!currentRequest) return;

    try {
      // Mark current driver as timeout and notify next
      const { data } = await supabase.rpc('driver_respond_to_request', {
        p_request_id: currentRequest.id,
        p_driver_id: currentRequest.currentDriverId,
        p_response: 'timeout'
      });

      const result = data as { success?: boolean; error?: string } | null;
      if (result && !result.success && result.error === 'No drivers available') {
        toast.error("Aucun chauffeur disponible", {
          description: "Réessayez dans quelques instants"
        });
        setIsSearching(false);
        setCurrentRequest(null);
      }
    } catch (error) {
      console.error("Error handling driver timeout:", error);
    }
  }, [currentRequest]);

  const createRideRequest = useCallback(async (params: {
    origin: string;
    originLat: number;
    originLng: number;
    destination: string;
    destinationLat: number;
    destinationLng: number;
    estimatedFare: number;
    vehicleType?: string;
    passengerCount?: number;
  }): Promise<string | null> => {
    if (!user) {
      toast.error("Veuillez vous connecter");
      return null;
    }

    setIsSearching(true);
    setCountdown(DRIVER_TIMEOUT_SECONDS);

    try {
      // Get surge multiplier for the zone
      const { data: surgeData } = await supabase
        .from('surge_pricing_zones')
        .select('surge_multiplier')
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('calculated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const surgeMultiplier = surgeData?.surge_multiplier || 1.0;
      const finalFare = Math.round(params.estimatedFare * Number(surgeMultiplier));

      // Create ride request
      const { data: requestData, error: requestError } = await supabase
        .from('ride_requests')
        .insert({
          client_id: user.id,
          origin: params.origin,
          origin_lat: params.originLat,
          origin_lng: params.originLng,
          destination: params.destination,
          destination_lat: params.destinationLat,
          destination_lng: params.destinationLng,
          estimated_fare: params.estimatedFare,
          surge_multiplier: surgeMultiplier,
          final_fare: finalFare,
          vehicle_type: params.vehicleType || 'taxi',
          passenger_count: params.passengerCount || 1,
          status: 'searching'
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Find and score best drivers
      const { data: driversData } = await supabase.rpc('find_best_drivers', {
        p_request_id: requestData.id,
        p_origin_lat: params.originLat,
        p_origin_lng: params.originLng,
        p_client_id: user.id
      });

      if (!driversData || driversData.length === 0) {
        toast.error("Aucun chauffeur à proximité", {
          description: "Réessayez dans quelques instants"
        });
        setIsSearching(false);
        return null;
      }

      // Store driver scores
      for (const driver of driversData) {
        await supabase.from('driver_match_scores').insert({
          ride_request_id: requestData.id,
          driver_id: driver.driver_id,
          total_score: driver.total_score,
          rank: driver.rank
        });
      }

      setMatchedDrivers(driversData.map((d: any) => ({
        driverId: d.driver_id,
        score: d.total_score,
        distanceKm: d.distance_km,
        rating: d.rating,
        acceptanceRate: d.acceptance_rate,
        hasHistory: d.has_history,
        rank: d.rank
      })));

      // Notify first driver
      const { data: notifyData } = await supabase.rpc('notify_next_driver', {
        p_request_id: requestData.id
      });

      const notifyResult = notifyData as { success?: boolean; driver_id?: string } | null;
      if (!notifyResult?.success) {
        toast.error("Impossible de notifier les chauffeurs");
        setIsSearching(false);
        return null;
      }

      // Subscribe to request updates
      subscriptionRef.current = supabase
        .channel(`ride_request_${requestData.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'ride_requests',
          filter: `id=eq.${requestData.id}`
        }, (payload) => {
          const updated = payload.new as any;
          setCurrentRequest({
            id: updated.id,
            origin: updated.origin,
            destination: updated.destination,
            estimatedFare: updated.estimated_fare,
            surgeMultiplier: updated.surge_multiplier,
            finalFare: updated.final_fare,
            status: updated.status,
            currentDriverId: updated.current_driver_id,
            matchedDriverId: updated.matched_driver_id,
            tripId: updated.trip_id
          });

          if (updated.status === 'matched') {
            toast.success("Chauffeur trouvé !", {
              description: "Votre course a été acceptée"
            });
            setIsSearching(false);
          } else if (updated.status === 'no_driver_available') {
            toast.error("Aucun chauffeur disponible");
            setIsSearching(false);
          }

          // Reset countdown when new driver is notified
          if (updated.current_driver_id !== currentRequest?.currentDriverId) {
            setCountdown(DRIVER_TIMEOUT_SECONDS);
          }
        })
        .subscribe();

      setCurrentRequest({
        id: requestData.id,
        origin: requestData.origin,
        destination: requestData.destination,
        estimatedFare: requestData.estimated_fare,
        surgeMultiplier: requestData.surge_multiplier,
        finalFare: requestData.final_fare,
        status: requestData.status,
        currentDriverId: notifyResult.driver_id || null,
        matchedDriverId: null,
        tripId: null
      });

      if (surgeMultiplier > 1) {
        toast.info(`Prix majoré x${surgeMultiplier}`, {
          description: "Forte demande dans cette zone"
        });
      }

      return requestData.id;
    } catch (error) {
      console.error("Error creating ride request:", error);
      toast.error("Erreur lors de la recherche");
      setIsSearching(false);
      return null;
    }
  }, [user, currentRequest]);

  const cancelRequest = useCallback(async () => {
    if (!currentRequest) return;

    try {
      await supabase
        .from('ride_requests')
        .update({ status: 'cancelled' })
        .eq('id', currentRequest.id);

      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }

      setIsSearching(false);
      setCurrentRequest(null);
      setMatchedDrivers([]);
      toast.info("Recherche annulée");
    } catch (error) {
      console.error("Error cancelling request:", error);
    }
  }, [currentRequest]);

  const respondToRequest = useCallback(async (
    requestId: string, 
    response: 'accept' | 'decline'
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('driver_respond_to_request', {
        p_request_id: requestId,
        p_driver_id: user.id,
        p_response: response
      });

      if (error) throw error;

      const result = data as { success?: boolean; trip_id?: string } | null;
      if (result?.success && response === 'accept') {
        toast.success("Course acceptée !");
        return true;
      } else if (response === 'decline') {
        toast.info("Course refusée");
      }

      return result?.success || false;
    } catch (error) {
      console.error("Error responding to request:", error);
      toast.error("Erreur lors de la réponse");
      return false;
    }
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  return {
    isSearching,
    currentRequest,
    matchedDrivers,
    countdown,
    createRideRequest,
    cancelRequest,
    respondToRequest
  };
};

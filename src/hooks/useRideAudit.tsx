import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type ActionType = 
  | 'ARRIVED' 
  | 'TIMER_START' 
  | 'MOVED_AWAY' 
  | 'CLIENT_CONFIRMED' 
  | 'NO_SHOW' 
  | 'CANCELLED' 
  | 'PICKUP_STARTED' 
  | 'TRIP_COMPLETED'
  | 'ZONE_VALIDATED'
  | 'PENALTY_WARNING';

interface AuditLogData {
  rideId: string;
  actionType: ActionType;
  driverLat?: number;
  driverLng?: number;
  clientLat?: number;
  clientLng?: number;
  distanceMeters?: number;
  metadata?: Record<string, unknown>;
}

interface AuditLogRecord {
  id: string;
  ride_id: string;
  driver_id: string;
  action_type: string;
  driver_lat: number | null;
  driver_lng: number | null;
  client_lat: number | null;
  client_lng: number | null;
  distance_meters: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const useRideAudit = () => {
  const { user } = useAuth();

  const logAction = async (data: AuditLogData): Promise<boolean> => {
    if (!user) return false;

    // Use type assertion for the new table that may not be in types yet
    const { error } = await (supabase as any)
      .from('ride_audit_logs')
      .insert({
        ride_id: data.rideId,
        driver_id: user.id,
        action_type: data.actionType,
        driver_lat: data.driverLat,
        driver_lng: data.driverLng,
        client_lat: data.clientLat,
        client_lng: data.clientLng,
        distance_meters: data.distanceMeters,
        metadata: data.metadata || {}
      });

    if (error) {
      console.error('Failed to log audit action:', error);
      return false;
    }

    return true;
  };

  const getAuditLogs = async (rideId: string): Promise<AuditLogRecord[]> => {
    const { data, error } = await (supabase as any)
      .from('ride_audit_logs')
      .select('*')
      .eq('ride_id', rideId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }

    return data || [];
  };

  return {
    logAction,
    getAuditLogs
  };
};
